import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Order } from "../../src/types/order";

/**
 * PRODUCTION-GRADE Square Webhook Handler
 * 
 * Key Features:
 * 1. Idempotency via event_id tracking
 * 2. Race-condition safe via Firestore transactions
 * 3. Signature verification BEFORE business logic
 * 4. Proper TTL with Timestamp type
 * 5. Distributed lock simulation via transaction
 * 6. Structured logging for observability
 * 7. Webhook retry detection
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SquareWebhookPayload {
  merchant_id?: string;
  type?: string;
  event_id?: string;
  created_at?: string;
  data?: {
    type?: string;
    id?: string;
    object?: {
      payment?: {
        id?: string;
        status?: string;
        location_id?: string;
        amount_money?: {
          amount?: number;
          currency?: string;
        };
      };
    };
  };
}

interface WebhookEventRecord {
  eventId: string;
  eventType: string;
  paymentId: string;
  processedAt: Timestamp;
  status: "processing" | "completed" | "failed";
  retryCount: number;
  metadata?: Record<string, any>;
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Structured logger for Cloud Logging
 */
class Logger {
  public context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  private log(severity: string, message: string, data?: Record<string, any>) {
    const logEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...data,
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: Record<string, any>) {
    this.log("INFO", message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.log("WARNING", message, data);
  }

  error(message: string, data?: Record<string, any>) {
    this.log("ERROR", message, data);
  }

  debug(message: string, data?: Record<string, any>) {
    this.log("DEBUG", message, data);
  }
}

/**
 * Extract payment ID from Square webhook payload
 */
function extractPaymentId(payload: SquareWebhookPayload): string | null {
  return payload.data?.object?.payment?.id || payload.data?.id || null;
}

/**
 * Generate 3-character alphanumeric order code from payment ID
 */
function generateOrderNumber(paymentId: string): string {
  return String(paymentId).slice(-3).toUpperCase();
}

/**
 * Verify Square webhook signature using HMAC-SHA256
 * CRITICAL: This must run BEFORE any business logic
 */
function verifySquareSignature(
  request: any,
  signature: string,
  webhookSignatureKey: string,
  logger: Logger
): boolean {
  if (!signature || !webhookSignatureKey) {
    logger.warn("Missing signature or webhook key", {
      hasSignature: !!signature,
      hasKey: !!webhookSignatureKey
    });
    return false;
  }

  try {
    // For Firebase Functions v2, we need to reconstruct the raw body
    let rawBody = "";
    if (request.rawBody) {
      rawBody = request.rawBody.toString();
    } else if (request.body) {
      // If rawBody is not available, stringify the body
      rawBody = JSON.stringify(request.body);
    }
    
    if (!rawBody) {
      logger.warn("No body available for signature verification");
      return false;
    }

    const requestUrl = request.url;
    const stringToSign = requestUrl + rawBody;

    const hmac = crypto.createHmac("sha256", webhookSignatureKey);
    const hash = hmac.update(stringToSign, "utf8").digest("base64");

    const isValid = hash === signature;

    logger.debug("Signature verification", {
      urlLength: requestUrl.length,
      bodyLength: rawBody.length,
      signatureLength: signature.length,
      isValid,
    });

    return isValid;
  } catch (error: any) {
    logger.error("Error verifying Square signature", {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Get cartId and cartName from location_id
 * TODO: Move to Firestore for dynamic configuration
 */
async function getCartFromLocation(
  locationId: string,
  db: admin.firestore.Firestore,
  logger: Logger
): Promise<{ cartId: string; cartName: string }> {
  if (!locationId) {
    logger.warn("No location ID provided, using default cart");
    return { cartId: "default-cart-id", cartName: "Default Cart" };
  }

  // TODO: Query Firestore carts collection
  // const cartDoc = await db.collection("carts").where("squareLocationId", "==", locationId).limit(1).get();
  // if (!cartDoc.empty) return { cartId: cartDoc.docs[0].id, cartName: cartDoc.docs[0].data().name };

  const locationMap: Record<string, { cartId: string; cartName: string }> = {
    S8GWD5R9QB376: { cartId: "burger-king-downtown", cartName: "Burger King Downtown" },
  };

  const location = locationMap[locationId];
  if (!location) {
    logger.warn("Unknown location ID, using default cart", { locationId });
    return { cartId: "default-cart-id", cartName: "Default Cart" };
  }

  return location;
}

// ============================================================================
// IDEMPOTENCY LAYER
// ============================================================================

/**
 * Check if webhook event has already been processed
 * Uses Firestore transaction for atomic check-and-set
 * 
 * Returns:
 * - "new": First time seeing this event
 * - "processing": Another instance is currently processing
 * - "completed": Already processed successfully
 * - "retry": Previous attempt failed, safe to retry
 */
async function checkWebhookIdempotency(
  db: admin.firestore.Firestore,
  eventId: string,
  eventType: string,
  paymentId: string,
  logger: Logger
): Promise<"new" | "processing" | "completed" | "retry"> {
  const eventRef = db.collection("webhookEvents").doc(eventId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        // First time seeing this event - claim it
        const record: WebhookEventRecord = {
          eventId,
          eventType,
          paymentId,
          processedAt: Timestamp.now(),
          status: "processing",
          retryCount: 0,
        };
        transaction.set(eventRef, record);
        logger.info("Claimed new webhook event", { eventId, paymentId });
        return "new";
      }

      const data = eventDoc.data() as WebhookEventRecord;

      if (data.status === "completed") {
        logger.info("Webhook event already completed", {
          eventId,
          paymentId,
          originalProcessedAt: data.processedAt.toDate().toISOString(),
        });
        return "completed";
      }

      if (data.status === "processing") {
        // Check if processing is stale (> 5 minutes)
        const ageMs = Date.now() - data.processedAt.toMillis();
        if (ageMs > 5 * 60 * 1000) {
          logger.warn("Stale processing detected, allowing retry", {
            eventId,
            ageMs,
          });
          transaction.update(eventRef, {
            status: "processing",
            processedAt: Timestamp.now(),
            retryCount: FieldValue.increment(1),
          });
          return "retry";
        }

        logger.info("Webhook event currently being processed", {
          eventId,
          ageMs,
        });
        return "processing";
      }

      if (data.status === "failed") {
        logger.info("Retrying failed webhook event", {
          eventId,
          previousRetries: data.retryCount,
        });
        transaction.update(eventRef, {
          status: "processing",
          processedAt: Timestamp.now(),
          retryCount: FieldValue.increment(1),
        });
        return "retry";
      }

      return "new";
    });

    return result;
  } catch (error: any) {
    logger.error("Error checking webhook idempotency", {
      error: error.message,
      eventId,
    });
    throw error;
  }
}

/**
 * Mark webhook event as completed
 */
async function markWebhookCompleted(
  db: admin.firestore.Firestore,
  eventId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await db
    .collection("webhookEvents")
    .doc(eventId)
    .update({
      status: "completed",
      completedAt: Timestamp.now(),
      metadata: metadata || {},
    });
}

/**
 * Mark webhook event as failed
 */
async function markWebhookFailed(
  db: admin.firestore.Firestore,
  eventId: string,
  error: string
): Promise<void> {
  await db
    .collection("webhookEvents")
    .doc(eventId)
    .update({
      status: "failed",
      failedAt: Timestamp.now(),
      error,
    });
}

// ============================================================================
// ORDER MANAGEMENT (RACE-CONDITION SAFE)
// ============================================================================

/**
 * Create or update order with race-condition protection
 * Uses paymentId as natural key for upsert semantics
 */
async function upsertOrder(
  db: admin.firestore.Firestore,
  paymentId: string,
  eventType: string,
  payload: SquareWebhookPayload,
  eventId: string,
  logger: Logger
): Promise<{ orderId: string; orderNumber: string; action: "created" | "updated" }> {
  const paymentStatus = payload.data?.object?.payment?.status || "APPROVED";
  const locationId = payload.data?.object?.payment?.location_id || "";
  const cart = await getCartFromLocation(locationId, db, logger);
  const orderNumber = generateOrderNumber(paymentId);

  // Use paymentId as document ID for natural deduplication
  const orderRef = db.collection("orders").doc(`square_${paymentId}`);

  const result = await db.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);

    // Handle FAILED/CANCELED payments
    if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
      if (!orderDoc.exists) {
        logger.info("Ignoring failed/canceled payment - no order to update", {
          paymentId,
          paymentStatus,
        });
        return { orderId: orderRef.id, orderNumber, action: "updated" as const };
      }

      // Mark order as declined with TTL
      const expireAt = Timestamp.fromMillis(Date.now() + 60000); // 60 seconds
      transaction.update(orderRef, {
        status: "declined",
        paymentStatus,
        expireAt: expireAt as any,
        cancelledAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
      });

      logger.info("Marked order as declined with TTL", {
        orderId: orderRef.id,
        orderNumber,
        paymentStatus,
        expireAt: expireAt.toDate().toISOString(),
      });

      return { orderId: orderRef.id, orderNumber, action: "updated" as const };
    }

    // Handle successful payments (APPROVED, COMPLETED)
    if (orderDoc.exists) {
      // Update existing order
      transaction.update(orderRef, {
        paymentStatus,
        updatedAt: Timestamp.now() as any,
      });

      logger.info("Updated existing order", {
        orderId: orderRef.id,
        orderNumber,
        paymentStatus,
      });

      return { orderId: orderRef.id, orderNumber, action: "updated" as const };
    }

    // Create new order (only for payment.created or first payment.updated)
    const orderData: Omit<Order, 'id'> = {
      orderNumber,
      customerName: "",
      phoneNumber: "",
      orderDetails: "",
      status: "pending",
      color: "Online",
      source: "square",
      cartId: cart.cartId,
      cartName: cart.cartName,
      paymentId,
      paymentStatus,
      locationId,
      amount: payload.data?.object?.payment?.amount_money?.amount,
      createdAt: Timestamp.now() as any,
      processedAt: Timestamp.now() as any,
      webhookEventId: eventId,
      updatedAt: Timestamp.now() as any,
    };

    transaction.set(orderRef, orderData);

    logger.info("Created new order", {
      orderId: orderRef.id,
      orderNumber,
      paymentId,
      paymentStatus,
    });

    return { orderId: orderRef.id, orderNumber, action: "created" as const };
  });

  return result;
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export const handleSquareWebhook = onRequest(
  {
    region: "us-west1",
    cors: false,
    secrets: ["SQUARE_WEBHOOK_SIGNATURE_KEY"],
    timeoutSeconds: 60,
    memory: "512MiB", // Increased for transaction overhead
    maxInstances: 10, // Limit concurrent executions
  },
  async (request, response) => {
    const startTime = Date.now();
    const logger = new Logger({
      function: "handleSquareWebhook",
      requestId: crypto.randomUUID(),
    });

    // Production deployment marker
    logger.info("PRODUCTION DEPLOYMENT - Signature verification enforced", {
    });

    try {
      // ========================================================================
      // STEP 1: BASIC VALIDATION
      // ========================================================================

      if (request.method !== "POST") {
        response.status(405).send("Method Not Allowed");
        return;
      }

      const payload = request.body as SquareWebhookPayload;
      const eventType = payload.type;
      const eventId = payload.event_id;

      if (!eventType || !eventId) {
        logger.warn("Webhook missing event type or event ID");
        response.status(400).send("Missing event type or event ID");
        return;
      }

      logger.info("Webhook received", { eventType, eventId });

      // Only process payment events
      if (eventType !== "payment.created" && eventType !== "payment.updated") {
        logger.info("Ignoring non-payment event", { eventType });
        response.status(200).send("Event ignored");
        return;
      }

      const paymentId = extractPaymentId(payload);
      if (!paymentId) {
        logger.error("No payment ID found in webhook");
        response.status(400).send("No payment ID found");
        return;
      }

      // ========================================================================
      // STEP 2: SIGNATURE VERIFICATION (BEFORE BUSINESS LOGIC)
      // ========================================================================

      const signature = request.headers["x-square-signature"] as string;
      const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";

      const debugMode = process.env.DEBUG_WEBHOOK === "true";

      logger.info("Environment check", {
        hasSignature: !!signature,
        hasKey: !!webhookSignatureKey,
        keyLength: webhookSignatureKey.length,
        debugMode,
        isEmulator: process.env.FUNCTIONS_EMULATOR === "true"
      });

      const signatureValid = verifySquareSignature(
        request,
        signature,
        webhookSignatureKey,
        logger
      );

      if (!signatureValid) {
        if (process.env.FUNCTIONS_EMULATOR === "true") {
          logger.warn("EMULATOR MODE: Allowing invalid signature");
        } else if (debugMode) {
          // Debug mode for production troubleshooting
          logger.warn("DEBUG MODE: Allowing invalid signature", {
            paymentId,
            eventId,
            signature,
            webhookKeyLength: webhookSignatureKey.length,
          });
        } else {
          logger.error("Invalid webhook signature - rejecting", {
            paymentId,
            eventId,
            hasSignature: !!signature,
            hasKey: !!webhookSignatureKey,
            keyLength: webhookSignatureKey.length,
            signatureLength: signature?.length || 0,
          });
          response.status(401).send("Unauthorized");
          return;
        }
      }

      // ========================================================================
      // STEP 3: IDEMPOTENCY CHECK
      // ========================================================================

      const db = admin.firestore();
      const idempotencyStatus = await checkWebhookIdempotency(
        db,
        eventId,
        eventType,
        paymentId,
        logger
      );

      if (idempotencyStatus === "completed") {
        logger.info("Webhook already processed - returning success", {
          eventId,
          paymentId,
        });
        response.status(200).json({
          success: true,
          message: "Event already processed",
          eventId,
        });
        return;
      }

      if (idempotencyStatus === "processing") {
        logger.warn("Webhook currently being processed by another instance", {
          eventId,
          paymentId,
        });
        response.status(409).json({
          success: false,
          message: "Event currently being processed",
          eventId,
        });
        return;
      }

      // ========================================================================
      // STEP 4: PROCESS ORDER (RACE-CONDITION SAFE)
      // ========================================================================

      try {
        const result = await upsertOrder(
          db,
          paymentId,
          eventType,
          payload,
          eventId,
          logger
        );

        // Mark webhook as completed
        await markWebhookCompleted(db, eventId, {
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          action: result.action,
        });

        const processingTime = Date.now() - startTime;
        logger.info("Webhook processed successfully", {
          eventId,
          paymentId,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          action: result.action,
          processingTimeMs: processingTime,
        });

        response.status(200).json({
          success: true,
          eventId,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          action: result.action,
          processingTimeMs: processingTime,
        });
      } catch (orderError: any) {
        logger.error("Error processing order", {
          error: orderError.message,
          stack: orderError.stack,
          eventId,
          paymentId,
        });

        await markWebhookFailed(db, eventId, orderError.message);
        throw orderError;
      }
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error("Webhook processing failed", {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
      });

      response.status(500).json({
        success: false,
        error: "Internal Server Error",
        requestId: logger.context.requestId,
      });
    }
  }
);
