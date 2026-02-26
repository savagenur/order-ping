import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * LAZY EXPIRATION OPTIMIZATION
 * 
 * Architecture: Expire-on-Read Pattern
 * 
 * Use Case:
 * - Triggered during order read operations (e.g., dashboard queries)
 * - Checks if order should be expired before returning data
 * - Reduces latency for end-users (no waiting for scheduled job)
 * 
 * Trade-offs:
 * - Pro: Immediate expiration on access
 * - Pro: No scheduled job overhead for low-traffic carts
 * - Con: Adds latency to read operations
 * - Con: Orders not accessed remain in "declined" state
 * 
 * Best Practice:
 * - Use ALONGSIDE OrderExpirationProcessor (not instead of)
 * - Lazy expiration = fast UX
 * - Scheduled processor = cleanup safety net
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OrderData {
  status: "pending" | "ready" | "completed" | "declined" | "expired";
  expireAt?: Timestamp;
  [key: string]: any;
}

// ============================================================================
// LAZY EXPIRATION LOGIC
// ============================================================================

/**
 * Check and expire order if needed (lazy expiration)
 * 
 * Call this function BEFORE returning order data to clients
 * 
 * Race-Condition Safety:
 * - Uses transaction to verify status before update
 * - Only updates if status is still "declined"
 * - Idempotent - safe to call multiple times
 * 
 * Performance:
 * - Adds ~50-100ms latency to read operations
 * - Only triggers for declined orders with expireAt
 * - Skips if already expired
 * 
 * @param db Firestore instance
 * @param orderId Document ID of the order
 * @returns Updated order data (or null if not found)
 */
export async function checkAndExpireOrder(
  db: admin.firestore.Firestore,
  orderId: string
): Promise<OrderData | null> {
  const orderRef = db.collection("orders").doc(orderId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        return null;
      }

      const data = orderDoc.data() as OrderData;

      // Skip if not declined or no expireAt
      if (data.status !== "declined" || !data.expireAt) {
        return data;
      }

      // Check if expired
      const now = Timestamp.now();
      if (data.expireAt.toMillis() <= now.toMillis()) {
        // Expire the order
        transaction.update(orderRef, {
          status: "expired",
          expiredAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        console.log(
          JSON.stringify({
            severity: "INFO",
            message: "Lazy expiration triggered",
            orderId,
            orderNumber: data.orderNumber,
            expireAt: data.expireAt.toDate().toISOString(),
          })
        );

        return {
          ...data,
          status: "expired" as const,
          expiredAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
      }

      return data;
    });

    return result;
  } catch (error: any) {
    console.error(
      JSON.stringify({
        severity: "ERROR",
        message: "Lazy expiration failed",
        orderId,
        error: error.message,
      })
    );
    throw error;
  }
}

/**
 * Batch lazy expiration for multiple orders
 * 
 * Use this when querying multiple orders (e.g., dashboard view)
 * 
 * Performance:
 * - Processes orders in parallel
 * - Only updates orders that need expiration
 * - Returns updated order data
 * 
 * @param db Firestore instance
 * @param orderIds Array of order document IDs
 * @returns Map of orderId -> OrderData (expired orders updated)
 */
export async function checkAndExpireOrdersBatch(
  db: admin.firestore.Firestore,
  orderIds: string[]
): Promise<Map<string, OrderData>> {
  const results = new Map<string, OrderData>();

  // Process in parallel (Firestore can handle concurrent transactions)
  const promises = orderIds.map(async (orderId) => {
    const data = await checkAndExpireOrder(db, orderId);
    if (data) {
      results.set(orderId, data);
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Lazy expiration for query results
 * 
 * Use this when you have a QuerySnapshot and want to expire orders
 * before returning to the client
 * 
 * Example Usage:
 * ```typescript
 * const snapshot = await db.collection("orders")
 *   .where("cartId", "==", cartId)
 *   .where("status", "in", ["pending", "declined"])
 *   .get();
 * 
 * const orders = await applyLazyExpirationToSnapshot(db, snapshot);
 * ```
 * 
 * @param db Firestore instance
 * @param snapshot QuerySnapshot from Firestore query
 * @returns Array of order data with lazy expiration applied
 */
export async function applyLazyExpirationToSnapshot(
  db: admin.firestore.Firestore,
  snapshot: admin.firestore.QuerySnapshot
): Promise<OrderData[]> {
  const now = Timestamp.now();
  const ordersToExpire: string[] = [];
  const orderDataMap = new Map<string, OrderData>();

  // First pass: identify orders that need expiration
  snapshot.forEach((doc) => {
    const data = doc.data() as OrderData;
    orderDataMap.set(doc.id, data);

    if (
      data.status === "declined" &&
      data.expireAt &&
      data.expireAt.toMillis() <= now.toMillis()
    ) {
      ordersToExpire.push(doc.id);
    }
  });

  // Second pass: expire orders that need it
  if (ordersToExpire.length > 0) {
    const expiredOrders = await checkAndExpireOrdersBatch(db, ordersToExpire);

    // Update the map with expired data
    expiredOrders.forEach((data, orderId) => {
      orderDataMap.set(orderId, data);
    });
  }

  return Array.from(orderDataMap.values());
}

/**
 * Helper: Check if order should be expired (without updating)
 * 
 * Use this for read-only checks (e.g., frontend filtering)
 * 
 * @param order Order data
 * @returns true if order should be expired
 */
export function shouldExpireOrder(order: OrderData): boolean {
  if (order.status !== "declined" || !order.expireAt) {
    return false;
  }

  const now = Timestamp.now();
  return order.expireAt.toMillis() <= now.toMillis();
}
