/**
 * EXAMPLE USAGE: Order Expiration System
 * 
 * This file demonstrates how to use both OrderExpirationProcessor
 * and Lazy Expiration in your Cloud Functions.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { applyLazyExpirationToSnapshot, checkAndExpireOrder } from "./lazyExpiration";

// ============================================================================
// EXAMPLE 1: Dashboard Query with Lazy Expiration
// ============================================================================

/**
 * Get orders for a specific cart with lazy expiration applied
 * 
 * Use Case: Admin dashboard showing all active orders
 * 
 * Benefits:
 * - Instant expiration feedback in UI
 * - No waiting for scheduled processor
 * - Better UX for active users
 */
export const getDashboardOrders = onCall(
  {
    region: "us-west1",
    cors: [
      "http://localhost:5173",
      "https://order-pingx.web.app",
      "https://order-pingx.firebaseapp.com",
    ],
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { cartId } = request.data;

    if (!cartId) {
      throw new HttpsError("invalid-argument", "cartId is required");
    }

    const db = admin.firestore();

    // Query orders for this cart
    const snapshot = await db
      .collection("orders")
      .where("cartId", "==", cartId)
      .where("status", "in", ["pending", "declined", "ready"])
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    // Apply lazy expiration before returning to client
    const orders = await applyLazyExpirationToSnapshot(db, snapshot);

    return {
      success: true,
      orders: orders.map((order) => ({
        id: order.orderNumber,
        ...order,
      })),
      count: orders.length,
    };
  }
);

// ============================================================================
// EXAMPLE 2: Single Order Fetch with Lazy Expiration
// ============================================================================

/**
 * Get a specific order by ID with lazy expiration
 * 
 * Use Case: Order detail view or status check
 */
export const getOrderById = onCall(
  {
    region: "us-west1",
    cors: [
      "http://localhost:5173",
      "https://order-pingx.web.app",
      "https://order-pingx.firebaseapp.com",
    ],
  },
  async (request) => {
    const { orderId } = request.data;

    if (!orderId) {
      throw new HttpsError("invalid-argument", "orderId is required");
    }

    const db = admin.firestore();

    // Check and expire order if needed
    const orderData = await checkAndExpireOrder(db, orderId);

    if (!orderData) {
      throw new HttpsError("not-found", "Order not found");
    }

    return {
      success: true,
      order: orderData,
    };
  }
);

// ============================================================================
// EXAMPLE 3: Public Queue Page (NO Lazy Expiration)
// ============================================================================

/**
 * Get orders for public queue display
 * 
 * Use Case: Customer-facing queue page
 * 
 * Note: NO lazy expiration here to minimize latency
 * Rely on scheduled processor for expiration
 */
export const getPublicQueueOrders = onCall(
  {
    region: "us-west1",
    cors: true, // Public endpoint
  },
  async (request) => {
    const { cartId } = request.data;

    if (!cartId) {
      throw new HttpsError("invalid-argument", "cartId is required");
    }

    const db = admin.firestore();

    // Simple query without lazy expiration (faster)
    const snapshot = await db
      .collection("orders")
      .where("cartId", "==", cartId)
      .where("status", "in", ["pending", "ready"])
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      orders,
      count: orders.length,
    };
  }
);

// ============================================================================
// EXAMPLE 4: Webhook Handler (Already Implemented)
// ============================================================================

/**
 * Square webhook handler sets expireAt when payment fails
 * 
 * See: functions/src/squareWebhook.ts
 * 
 * Relevant code:
 * ```typescript
 * if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
 *   const expireAt = Timestamp.fromMillis(Date.now() + 60000); // 60 seconds
 *   transaction.update(orderRef, {
 *     status: "declined",
 *     paymentStatus,
 *     expireAt,
 *     cancelledAt: Timestamp.now(),
 *     updatedAt: Timestamp.now(),
 *   });
 * }
 * ```
 */

// ============================================================================
// EXAMPLE 5: Manual Order Creation with Expiration
// ============================================================================

/**
 * Create a manual order (for testing or admin use)
 */
export const createManualOrder = onCall(
  {
    region: "us-west1",
  },
  async (request) => {
    // Verify admin access
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const caller = await admin.auth().getUser(request.auth.uid);
    if (caller.customClaims?.role !== "admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { cartId, orderDetails, shouldDecline } = request.data;

    const db = admin.firestore();
    const orderRef = db.collection("orders").doc();

    const orderData: any = {
      orderNumber: orderRef.id.slice(-3).toUpperCase(),
      customerName: "Manual Order",
      phoneNumber: "",
      orderDetails: orderDetails || "Test order",
      status: shouldDecline ? "declined" : "pending",
      color: "Manual",
      source: "manual",
      cartId,
      cartName: "Manual Entry",
      createdAt: admin.firestore.Timestamp.now(),
      processedAt: admin.firestore.Timestamp.now(),
    };

    // If declined, set expireAt
    if (shouldDecline) {
      orderData.expireAt = admin.firestore.Timestamp.fromMillis(
        Date.now() + 60000 // 60 seconds
      );
    }

    await orderRef.set(orderData);

    return {
      success: true,
      orderId: orderRef.id,
      orderNumber: orderData.orderNumber,
      willExpireAt: orderData.expireAt?.toDate().toISOString(),
    };
  }
);

// ============================================================================
// EXAMPLE 6: Monitoring - Get Expiration Metrics
// ============================================================================

/**
 * Get metrics about order expiration system
 * 
 * Use Case: Admin dashboard monitoring
 */
export const getExpirationMetrics = onCall(
  {
    region: "us-west1",
  },
  async (request) => {
    // Verify admin access
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const caller = await admin.auth().getUser(request.auth.uid);
    if (caller.customClaims?.role !== "admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Count orders by status
    const [pendingSnapshot, declinedSnapshot, expiredSnapshot] = await Promise.all([
      db.collection("orders").where("status", "==", "pending").count().get(),
      db.collection("orders").where("status", "==", "declined").count().get(),
      db.collection("orders").where("status", "==", "expired").count().get(),
    ]);

    // Count orders waiting to expire
    const waitingToExpireSnapshot = await db
      .collection("orders")
      .where("status", "==", "declined")
      .where("expireAt", "<=", now)
      .count()
      .get();

    return {
      success: true,
      metrics: {
        pending: pendingSnapshot.data().count,
        declined: declinedSnapshot.data().count,
        expired: expiredSnapshot.data().count,
        waitingToExpire: waitingToExpireSnapshot.data().count,
        timestamp: now.toDate().toISOString(),
      },
    };
  }
);

// ============================================================================
// BEST PRACTICES SUMMARY
// ============================================================================

/**
 * When to Use Lazy Expiration:
 * ✅ Admin dashboard (low latency requirement, high accuracy requirement)
 * ✅ Order detail views (single order fetch)
 * ✅ Internal tools (monitoring, reporting)
 * 
 * When NOT to Use Lazy Expiration:
 * ❌ Public queue page (high traffic, latency-sensitive)
 * ❌ Webhook handlers (already setting expireAt)
 * ❌ Batch operations (use scheduled processor instead)
 * 
 * General Rule:
 * - Use lazy expiration for admin/internal tools (better UX)
 * - Rely on scheduled processor for public-facing queries (better performance)
 * - Both approaches work together (redundancy is good)
 */
