# OrderPing Production Architecture Guide

## Overview

This document outlines the production-grade architecture for OrderPing's Square payment webhook integration, addressing critical vulnerabilities in the original implementation.

---

## Architecture Principles

### 1. **Idempotency First**
Every webhook event must be processed exactly once, even if Square retries delivery.

### 2. **Race-Condition Safety**
Multiple concurrent webhook events for the same payment must not create duplicate orders.

### 3. **Security by Default**
Signature verification happens before any business logic or database queries.

### 4. **Observability**
Structured logging enables debugging, monitoring, and alerting in production.

### 5. **Scalability**
Design supports multiple food trucks, multiple regions, and high throughput.

---

## Firestore Schema Design

### Collection: `orders`

**Document ID Strategy:** Use `square_{paymentId}` as document ID for natural deduplication.

```typescript
{
  // Document ID: "square_abc123xyz"
  orderNumber: "XYZ",              // Last 3 chars of paymentId (uppercase)
  customerName: "",                 // Square doesn't provide this
  phoneNumber: "",
  orderDetails: "",
  status: "pending",                // lowercase: pending|ready|completed|declined|expired
  color: "Online",
  source: "square",
  cartId: "burger-king-downtown",
  cartName: "Square Terminal",
  paymentId: "abc123xyz",           // Square payment ID
  paymentStatus: "APPROVED",        // UPPERCASE: APPROVED|COMPLETED|FAILED|CANCELED
  locationId: "S8GWD5R9QB376",      // Square location ID
  createdAt: Timestamp,
  updatedAt?: Timestamp,
  expireAt?: Timestamp,             // TTL field (must be Timestamp, not Date)
  processedAt: Timestamp,
  webhookEventId: "evt_123",        // Link to webhookEvents for audit trail
  cancelledAt?: Timestamp
}
```

**Key Design Decisions:**

1. **Document ID = `square_{paymentId}`**
   - Prevents duplicate orders at the database level
   - Firestore guarantees document ID uniqueness
   - Transaction on same doc ID will serialize (prevents race conditions)

2. **TTL Field Type**
   - **MUST** be `Timestamp` (from `firebase-admin/firestore`)
   - **NOT** JavaScript `Date` object
   - Firestore TTL policy only works with `Timestamp` type

3. **Status Values**
   - `status`: lowercase (for UI consistency)
   - `paymentStatus`: UPPERCASE (matches Square API)

---

### Collection: `webhookEvents`

**Document ID:** Use Square's `event_id` directly.

```typescript
{
  // Document ID: "evt_abc123"
  eventId: "evt_abc123",
  eventType: "payment.created",
  paymentId: "abc123xyz",
  processedAt: Timestamp,
  completedAt?: Timestamp,
  failedAt?: Timestamp,
  status: "processing" | "completed" | "failed",
  retryCount: 0,
  error?: string,
  metadata?: {
    orderId: "square_abc123xyz",
    orderNumber: "XYZ",
    action: "created"
  }
}
```

**Purpose:**
- Idempotency: Prevent duplicate processing of same event
- Audit trail: Track all webhook events received
- Debugging: Identify failed/stuck events
- Retry detection: Distinguish new events from retries

**Lifecycle:**
1. Event arrives → Create doc with `status: "processing"`
2. Order created/updated → Update to `status: "completed"`
3. Error occurs → Update to `status: "failed"`
4. Retry arrives → Check status, skip if "completed"

---

### Collection: `carts` (Future Enhancement)

Store location-to-cart mappings dynamically:

```typescript
{
  // Document ID: "burger-king-downtown"
  id: "burger-king-downtown",
  name: "Burger King Downtown",
  displayName: "BK Downtown",
  squareLocationId: "S8GWD5R9QB376",  // Map Square location to cart
  active: true,
  createdAt: Timestamp
}
```

---

## Required Firestore Indexes

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "paymentId", "order": "ASCENDING"},
        {"fieldPath": "source", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "webhookEvents",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "processedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "webhookEvents",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "paymentId", "order": "ASCENDING"},
        {"fieldPath": "processedAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Firestore Security Rules

**CRITICAL FIX:** Remove the insecure rule allowing unauthenticated order creation.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
             (request.auth.token.role == 'admin' || 
              request.auth.token.role == 'superadmin');
    }
    
    function hasCartAccess(cartId) {
      return request.auth != null && 
             request.auth.token.cartId == cartId;
    }
    
    // Orders - Admin or cart worker
    // Cloud Functions use Admin SDK (bypasses rules)
    match /orders/{orderId} {
      allow read: if true; // Public queue page
      allow write: if isAdmin();
      allow create, update: if hasCartAccess(request.resource.data.cartId);
      // REMOVED: allow create: if request.auth == null && request.resource.data.source == 'square';
    }
    
    // Webhook events - Cloud Functions only (Admin SDK bypasses rules)
    match /webhookEvents/{eventId} {
      allow read: if isAdmin();
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Carts
    match /carts/{cartId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Workers
    match /workers/{workerId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Users
    match /users/{userId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAny([
        'currentCartId', 'fcmToken', 'selectedOrderId', 
        'trackedOrderIds', 'lastActive'
      ]);
    }
  }
}
```

**Why This Works:**
- Cloud Functions use **Admin SDK** → bypasses all security rules
- No need for special "unauthenticated" rule
- Attackers can't create fake orders via REST API

---

## Firestore TTL Configuration

Enable TTL policy for `expireAt` field:

### Via Firebase Console:
1. Go to Firestore → Settings → Time-to-Live (TTL)
2. Create TTL policy:
   - Collection: `orders`
   - Field: `expireAt`
   - Type: `Timestamp`

### Via gcloud CLI:
```bash
gcloud firestore fields ttls create expireAt \
  --collection-group=orders \
  --project=your-project-id
```

**Important:**
- TTL field **MUST** be `Timestamp` type (not `Date`)
- TTL runs daily (not real-time)
- Documents deleted within 24-72 hours of expiration
- For real-time expiration, use Cloud Scheduler + Cloud Function

---

## Webhook Processing Flow

### Flow Diagram

```
Square Webhook → Cloud Function
    ↓
1. Validate HTTP method (POST only)
    ↓
2. Extract event_id, event_type, payment_id
    ↓
3. VERIFY SIGNATURE (BEFORE business logic)
    ↓
4. Check idempotency (webhookEvents collection)
    ├─ Already completed? → Return 200 OK
    ├─ Currently processing? → Return 409 Conflict
    └─ New/retry? → Continue
    ↓
5. Start Firestore transaction
    ├─ Get order doc (ID: square_{paymentId})
    ├─ If FAILED/CANCELED payment:
    │   ├─ Order exists? → Update status="declined", set expireAt
    │   └─ No order? → Ignore
    ├─ If APPROVED/COMPLETED payment:
    │   ├─ Order exists? → Update paymentStatus
    │   └─ No order? → Create new order
    └─ Commit transaction
    ↓
6. Mark webhook event as completed
    ↓
7. Return 200 OK with metadata
```

### Idempotency Logic

```typescript
// Transaction ensures atomic check-and-set
const eventRef = db.collection("webhookEvents").doc(event_id);

await db.runTransaction(async (txn) => {
  const doc = await txn.get(eventRef);
  
  if (!doc.exists) {
    // First time seeing this event
    txn.set(eventRef, {
      eventId: event_id,
      status: "processing",
      processedAt: Timestamp.now()
    });
    return "new";
  }
  
  const data = doc.data();
  
  if (data.status === "completed") {
    // Already processed - skip
    return "completed";
  }
  
  if (data.status === "processing") {
    // Check if stale (> 5 minutes)
    const ageMs = Date.now() - data.processedAt.toMillis();
    if (ageMs > 5 * 60 * 1000) {
      // Stale - allow retry
      txn.update(eventRef, {
        status: "processing",
        processedAt: Timestamp.now(),
        retryCount: FieldValue.increment(1)
      });
      return "retry";
    }
    // Currently processing - reject
    return "processing";
  }
  
  // Failed - allow retry
  return "retry";
});
```

### Race-Condition Prevention

**Key Strategy:** Use `paymentId` as document ID.

```typescript
// Document ID = "square_{paymentId}"
const orderRef = db.collection("orders").doc(`square_${paymentId}`);

await db.runTransaction(async (txn) => {
  const orderDoc = await txn.get(orderRef);
  
  if (orderDoc.exists) {
    // Update existing order
    txn.update(orderRef, { paymentStatus, updatedAt: Timestamp.now() });
  } else {
    // Create new order
    txn.set(orderRef, { ...orderData });
  }
});
```

**Why This Works:**
- Firestore serializes transactions on the same document
- If `payment.created` and `payment.updated` arrive simultaneously:
  - Both start transactions
  - First transaction commits → creates order
  - Second transaction sees existing order → updates it
  - No duplicates possible

---

## Error Handling & Retry Strategy

### Square Webhook Retry Behavior

Square retries webhooks with exponential backoff:
- Retry 1: Immediate
- Retry 2: 1 minute
- Retry 3: 5 minutes
- Retry 4: 30 minutes
- Retry 5+: 1 hour (up to 3 days)

### Response Codes

| Code | Meaning | Square Action |
|------|---------|---------------|
| 200 | Success | Stop retrying |
| 409 | Conflict (duplicate) | Stop retrying |
| 4xx | Client error | Stop retrying |
| 5xx | Server error | Retry with backoff |

### Recommended Responses

```typescript
// Success - first time processing
return 200 { success: true, action: "created" }

// Success - idempotent retry
return 200 { success: true, message: "Already processed" }

// Concurrent processing
return 409 { success: false, message: "Currently processing" }

// Invalid signature
return 401 { success: false, error: "Unauthorized" }

// Internal error
return 500 { success: false, error: "Internal Server Error" }
```

---

## Monitoring & Alerting

### Key Metrics to Track

1. **Webhook Processing Time**
   - Target: < 1 second p95
   - Alert if > 5 seconds

2. **Idempotency Hit Rate**
   - Track: `webhookEvents` with status="completed" on first check
   - High rate indicates Square is retrying (investigate why)

3. **Failed Webhooks**
   - Alert on any `webhookEvents` with status="failed"

4. **Duplicate Orders**
   - Query: Orders with same `paymentId` but different document IDs
   - Should be ZERO in production

5. **Stale Processing**
   - Query: `webhookEvents` with status="processing" and `processedAt` > 5 minutes ago
   - Indicates function timeout or crash

### Cloud Logging Queries

**Find duplicate orders:**
```
resource.type="cloud_function"
jsonPayload.message="Created new order"
jsonPayload.paymentId="abc123"
```

**Find failed webhooks:**
```
resource.type="cloud_function"
jsonPayload.severity="ERROR"
jsonPayload.function="handleSquareWebhookV2"
```

**Find idempotent retries:**
```
resource.type="cloud_function"
jsonPayload.message="Webhook already processed"
```

### Cloud Monitoring Alerts

**Alert: High webhook failure rate**
```
Metric: cloud.googleapis.com/functions/execution_count
Filter: status != "ok"
Condition: Rate > 5% over 5 minutes
```

**Alert: Slow webhook processing**
```
Metric: cloud.googleapis.com/functions/execution_times
Condition: 95th percentile > 5000ms
```

---

## Testing Strategy

### Unit Tests

Test idempotency logic:
```typescript
describe("checkWebhookIdempotency", () => {
  it("should return 'new' for first event", async () => {
    const result = await checkWebhookIdempotency(db, "evt_123", ...);
    expect(result).toBe("new");
  });
  
  it("should return 'completed' for duplicate event", async () => {
    // Create completed event
    await db.collection("webhookEvents").doc("evt_123").set({
      status: "completed"
    });
    
    const result = await checkWebhookIdempotency(db, "evt_123", ...);
    expect(result).toBe("completed");
  });
  
  it("should handle concurrent requests", async () => {
    // Simulate race condition
    const [result1, result2] = await Promise.all([
      checkWebhookIdempotency(db, "evt_123", ...),
      checkWebhookIdempotency(db, "evt_123", ...)
    ]);
    
    // One should succeed, one should see "processing"
    expect([result1, result2].sort()).toEqual(["new", "processing"]);
  });
});
```

### Integration Tests

Test full webhook flow:
```typescript
describe("handleSquareWebhookV2", () => {
  it("should create order on payment.created", async () => {
    const payload = {
      type: "payment.created",
      event_id: "evt_123",
      data: {
        object: {
          payment: {
            id: "pay_abc123",
            status: "APPROVED",
            location_id: "S8GWD5R9QB376"
          }
        }
      }
    };
    
    const response = await callFunction(payload);
    
    expect(response.status).toBe(200);
    expect(response.body.action).toBe("created");
    
    // Verify order exists
    const order = await db.collection("orders").doc("square_pay_abc123").get();
    expect(order.exists).toBe(true);
    expect(order.data().status).toBe("pending");
  });
  
  it("should handle duplicate payment.created", async () => {
    // Send same event twice
    const payload = { /* same as above */ };
    
    const response1 = await callFunction(payload);
    const response2 = await callFunction(payload);
    
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response2.body.message).toContain("Already processed");
    
    // Verify only one order exists
    const orders = await db.collection("orders")
      .where("paymentId", "==", "pay_abc123")
      .get();
    expect(orders.size).toBe(1);
  });
  
  it("should mark order declined on FAILED payment", async () => {
    // Create order first
    await db.collection("orders").doc("square_pay_abc123").set({
      status: "pending",
      paymentId: "pay_abc123"
    });
    
    // Send payment.updated with FAILED
    const payload = {
      type: "payment.updated",
      event_id: "evt_456",
      data: {
        object: {
          payment: {
            id: "pay_abc123",
            status: "FAILED"
          }
        }
      }
    };
    
    const response = await callFunction(payload);
    
    expect(response.status).toBe(200);
    
    // Verify order marked declined with TTL
    const order = await db.collection("orders").doc("square_pay_abc123").get();
    expect(order.data().status).toBe("declined");
    expect(order.data().expireAt).toBeDefined();
    expect(order.data().expireAt.toMillis()).toBeGreaterThan(Date.now());
  });
});
```

### Load Testing

Simulate concurrent webhooks:
```bash
# Send 100 concurrent requests with same event_id
ab -n 100 -c 100 -p webhook.json \
  -H "x-square-signature: ..." \
  https://us-west1-project.cloudfunctions.net/handleSquareWebhookV2
```

Expected result:
- 1 order created
- 99 responses with "Already processed"
- No errors

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update `firestore.indexes.json` with new indexes
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`
- [ ] Update `firestore.rules` (remove insecure rule)
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Configure TTL policy for `expireAt` field
- [ ] Set `SQUARE_WEBHOOK_SIGNATURE_KEY` secret
- [ ] Test webhook signature verification in emulator

### Deployment

- [ ] Deploy new function: `firebase deploy --only functions:handleSquareWebhookV2`
- [ ] Update Square webhook URL to new function
- [ ] Monitor Cloud Logging for errors
- [ ] Send test webhook from Square Dashboard
- [ ] Verify order created successfully

### Post-Deployment

- [ ] Set up Cloud Monitoring alerts
- [ ] Create dashboard for webhook metrics
- [ ] Document runbook for common issues
- [ ] Schedule weekly review of failed webhooks
- [ ] Plan migration from old function (gradual rollout)

### Rollback Plan

If issues occur:
1. Update Square webhook URL back to old function
2. Investigate errors in Cloud Logging
3. Fix issues in new function
4. Re-deploy and test
5. Switch back to new function

---

## Migration Strategy

### Phase 1: Parallel Deployment (Week 1)
- Deploy new function alongside old function
- Route 10% of webhooks to new function (via Square webhook URL rotation)
- Monitor for errors
- Compare order creation between old/new functions

### Phase 2: Gradual Rollout (Week 2-3)
- Increase to 50% traffic
- Monitor idempotency metrics
- Verify no duplicate orders

### Phase 3: Full Migration (Week 4)
- Route 100% traffic to new function
- Keep old function deployed (backup)
- Monitor for 1 week

### Phase 4: Cleanup (Week 5)
- Delete old function
- Archive old code
- Update documentation

---

## Common Issues & Debugging

### Issue: Duplicate Orders Created

**Symptoms:**
- Multiple orders with same `paymentId`
- Different document IDs

**Root Cause:**
- Not using `paymentId` as document ID
- Missing transaction around order creation

**Fix:**
- Ensure document ID = `square_{paymentId}`
- Wrap create/update in transaction

### Issue: TTL Not Deleting Orders

**Symptoms:**
- Declined orders not auto-deleted after 60 seconds

**Root Causes:**
1. `expireAt` field is `Date` instead of `Timestamp`
2. TTL policy not configured
3. TTL runs daily (not real-time)

**Fix:**
```typescript
// WRONG
expireAt: new Date(Date.now() + 60000)

// CORRECT
import { Timestamp } from "firebase-admin/firestore";
expireAt: Timestamp.fromMillis(Date.now() + 60000)
```

### Issue: Webhook Signature Verification Fails

**Symptoms:**
- All webhooks rejected with 401

**Debug Steps:**
1. Check `SQUARE_WEBHOOK_SIGNATURE_KEY` is set correctly
2. Verify `rawBody` is available (requires Cloud Functions v2)
3. Check request URL matches Square's expectations (ngrok vs production)
4. Enable debug logging for signature verification

**Common Mistakes:**
- Using parsed `request.body` instead of `rawBody`
- Wrong URL in signature calculation (local vs ngrok)
- Signature key from wrong Square environment (sandbox vs production)

### Issue: Stale "processing" Events

**Symptoms:**
- `webhookEvents` stuck in "processing" status

**Root Cause:**
- Function timeout before marking completed
- Unhandled exception after claiming event

**Fix:**
- Increase function timeout to 60 seconds
- Add try/catch around order processing
- Mark as "failed" on exception

---

## Fintech-Grade Enhancements

### 1. Distributed Locking (Cloud Firestore)

For multi-region deployments, use distributed locks:

```typescript
import { Firestore } from "@google-cloud/firestore";

async function acquireLock(
  db: Firestore,
  lockKey: string,
  ttlSeconds: number = 30
): Promise<boolean> {
  const lockRef = db.collection("locks").doc(lockKey);
  const expireAt = Timestamp.fromMillis(Date.now() + ttlSeconds * 1000);
  
  try {
    await db.runTransaction(async (txn) => {
      const lock = await txn.get(lockRef);
      
      if (lock.exists && lock.data()!.expireAt.toMillis() > Date.now()) {
        throw new Error("Lock already held");
      }
      
      txn.set(lockRef, { expireAt, acquiredAt: Timestamp.now() });
    });
    return true;
  } catch {
    return false;
  }
}
```

### 2. Dead Letter Queue

Store failed webhooks for manual review:

```typescript
async function sendToDeadLetterQueue(
  db: Firestore,
  eventId: string,
  payload: any,
  error: string
) {
  await db.collection("deadLetterQueue").add({
    eventId,
    payload,
    error,
    createdAt: Timestamp.now(),
    retryCount: 0,
    status: "pending"
  });
}
```

### 3. Reconciliation Job

Daily Cloud Scheduler job to detect discrepancies:

```typescript
// Check for orders without corresponding webhook events
// Check for webhook events without corresponding orders
// Alert on mismatches
```

### 4. Audit Trail

Store all state transitions:

```typescript
await db.collection("orderAudit").add({
  orderId: "square_abc123",
  previousStatus: "pending",
  newStatus: "declined",
  changedBy: "webhook:evt_123",
  changedAt: Timestamp.now(),
  reason: "Payment FAILED"
});
```

### 5. Circuit Breaker

Prevent cascading failures:

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker open");
      }
    }
    
    try {
      const result = await fn();
      this.failureCount = 0;
      this.state = "closed";
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= 5) {
        this.state = "open";
      }
      
      throw error;
    }
  }
}
```

---

## Performance Optimization

### 1. Batch Webhook Processing

If Square sends bursts of webhooks, use Cloud Tasks:

```typescript
// In webhook handler
await cloudTasks.createTask({
  queue: "webhook-processing",
  payload: { eventId, paymentId, payload }
});

// Separate Cloud Function processes queue
// Allows rate limiting, retries, backpressure
```

### 2. Firestore Connection Pooling

Reuse Firestore client across invocations:

```typescript
// Outside function handler
let db: admin.firestore.Firestore | null = null;

export const handleSquareWebhookV2 = onRequest(async (req, res) => {
  if (!db) {
    db = admin.firestore();
  }
  // Use db...
});
```

### 3. Parallel Queries

Use Promise.all for independent operations:

```typescript
const [cartId, webhookStatus] = await Promise.all([
  getCartIdFromLocation(locationId, db, logger),
  checkWebhookIdempotency(db, eventId, eventType, paymentId, logger)
]);
```

---

## Conclusion

The production-grade architecture addresses all critical vulnerabilities:

✅ **Idempotency:** `webhookEvents` collection with atomic check-and-set  
✅ **Race Conditions:** Document ID = `paymentId` + Firestore transactions  
✅ **Security:** Signature verification before business logic  
✅ **TTL:** Proper `Timestamp` type for auto-deletion  
✅ **Scalability:** Supports multiple trucks via dynamic cart mapping  
✅ **Observability:** Structured logging + Cloud Monitoring  
✅ **Reliability:** Error handling, retries, dead letter queue  

This system is now **fintech-grade** and ready for production.
