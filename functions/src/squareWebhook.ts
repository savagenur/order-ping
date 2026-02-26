import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Square Webhook Handler
 * Listens for payment.created and payment.updated events from Square
 * Creates orders in Firestore with 3-character alphanumeric codes
 */

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

/**
 * Extract payment ID from Square webhook payload
 * Priority: data.object.payment.id -> data.id
 */
function extractPaymentId(payload: SquareWebhookPayload): string | null {
  // First priority: data.object.payment.id
  if (payload.data?.object?.payment?.id) {
    return payload.data.object.payment.id;
  }
  
  // Fallback: data.id
  if (payload.data?.id) {
    return payload.data.id;
  }
  
  return null;
}

/**
 * Generate 3-character alphanumeric order code from payment ID
 * Uses last 3 characters and converts to uppercase
 */
function generateOrderNumber(paymentId: string): string {
  return String(paymentId).slice(-3).toUpperCase();
}

/**
 * Verify Square webhook signature using HMAC-SHA256
 * Square sends a signature in the x-square-signature header
 * Uses rawBody and handles ngrok URL requirements
 */
function verifySquareSignature(
  request: any,
  signature: string,
  webhookSignatureKey: string
): boolean {
  if (!signature || !webhookSignatureKey) {
    console.warn("Missing signature or webhook key");
    return false;
  }
  
  try {
    // Use rawBody for signature calculation (required by Square)
    const rawBody = (request as any).rawBody?.toString() || '';
    if (!rawBody) {
      console.warn("No rawBody available for signature verification");
      return false;
    }
    
    // Get the actual URL the request was sent to
    // For ngrok, this should be the https://ngrok-url format
    const requestUrl = request.url;
    console.log("Signature verification using URL:", requestUrl);
    
    // Square signs: URL + rawBody
    const stringToSign = requestUrl + rawBody;
    
    const hmac = crypto.createHmac("sha256", webhookSignatureKey);
    const hash = hmac.update(stringToSign, "utf8").digest("base64");
    
    console.log("Signature verification details:", {
      urlLength: requestUrl.length,
      bodyLength: rawBody.length,
      totalLength: stringToSign.length,
      expectedSignature: hash,
      receivedSignature: signature
    });
    
    return hash === signature;
  } catch (error) {
    console.error("Error verifying Square signature:", error);
    return false;
  }
}




/**
 * Map Square location_id to cartId with validation
 * TODO: Store this mapping in Firestore or environment variables for scalability
 */
function getCartIdFromLocation(locationId: string): string {
  if (!locationId) {
    console.warn("No location ID provided, using default cart");
    return "default-cart-id";
  }
  
  const locationMap: Record<string, string> = {
    'S8GWD5R9QB376': 'burger-king-downtown',
    // Add more location mappings here for additional trucks
  };
  
  const cartId = locationMap[locationId];
  if (!cartId) {
    console.warn(`Unknown location ID: ${locationId}, using default cart`);
    return "default-cart-id";
  }
  
  return cartId;
}

export const handleSquareWebhook = onRequest(
  {
    region: "us-west1",
    cors: false, // Square webhooks don't need CORS
    secrets: ["SQUARE_WEBHOOK_SIGNATURE_KEY"],
    timeoutSeconds: 60, // Increased timeout for webhook processing
    memory: "256MiB", // Adequate memory for webhook processing
  },
  async (request, response) => {
    const startTime = Date.now();
    
    try {
      // Only accept POST requests
      if (request.method !== "POST") {
        response.status(405).send("Method Not Allowed");
        return;
      }

      const payload = request.body as SquareWebhookPayload;
      const eventType = payload.type;

      // Early validation and logging
      if (!eventType) {
        console.warn("Webhook received without event type");
        response.status(400).send("Missing event type");
        return;
      }

      console.log("Square Webhook received:", {
        type: eventType,
        event_id: payload.event_id,
        timestamp: new Date().toISOString(),
      });

      // Only process payment events
      if (eventType !== "payment.created" && eventType !== "payment.updated") {
        console.log("Ignoring non-payment event:", eventType);
        response.status(200).send("Event ignored");
        return;
      }

      // Extract and validate payment ID
      const paymentId = extractPaymentId(payload);
      
      if (!paymentId) {
        console.error("Square Webhook received but no payment ID found", {
          payload: JSON.stringify(payload),
          headers: request.headers
        });
        response.status(400).send("No payment ID found");
        return;
      }

      // For payment.created, check payment status before creating order
      if (eventType === "payment.created") {
        const paymentStatus = payload.data?.object?.payment?.status;
        
        if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
          console.log("Ignoring failed/canceled payment creation:", {
            paymentId,
            paymentStatus
          });
          response.status(200).json({
            success: true,
            action: "ignored",
            message: `Payment ${paymentStatus.toLowerCase()} - order not created`
          });
          return;
        }
      }
      
      // For payment.updated, check payment status
      if (eventType === "payment.updated") {
        const paymentStatus = payload.data?.object?.payment?.status;
        
        if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
          // Find existing order by payment ID
          const db = admin.firestore();
          const existingOrders = await db
            .collection("orders")
            .where("paymentId", "==", paymentId)
            .where("source", "==", "square")
            .limit(1)
            .get();
          
          if (existingOrders.empty) {
            console.log("No existing order found for failed/canceled payment:", paymentId);
            response.status(200).json({
              success: true,
              action: "ignored",
              message: `Payment ${paymentStatus.toLowerCase()} - no existing order to update`
            });
            return;
          } else {
            // Update existing order payment status only
            const orderDoc = existingOrders.docs[0];
            await orderDoc.ref.update({
              cancelledAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              paymentStatus: paymentStatus // Use actual status from Square (FAILED or CANCELED)
            });
            
            console.log("Updated order payment status:", {
              orderId: orderDoc.id,
              orderNumber: orderDoc.data()?.orderNumber,
              paymentId,
              paymentStatus
            });
            
            response.status(200).json({
              success: true,
              action: "updated",
              orderId: orderDoc.id,
              orderNumber: orderDoc.data()?.orderNumber,
              paymentStatus: paymentStatus,
              message: `Order payment ${paymentStatus.toLowerCase()}`
            });
            return;
          }
        }
        
        // Allow APPROVED and COMPLETED payments to proceed
        if (paymentStatus !== "COMPLETED" && paymentStatus !== "APPROVED") {
          console.log("Ignoring non-approved payment update:", paymentStatus);
          response.status(200).send("Payment not approved");
          return;
        }
        
        // Find existing order by payment ID
        const db = admin.firestore();
        const existingOrders = await db
          .collection("orders")
          .where("paymentId", "==", paymentId)
          .where("source", "==", "square")
          .limit(1)
          .get();
        
        if (existingOrders.empty) {
          console.log("No existing order found for payment update, creating new order:", paymentId);
          // Fall through to create new order
        } else {
          // Update existing order
          const orderDoc = existingOrders.docs[0];
          await orderDoc.ref.update({
            updatedAt: FieldValue.serverTimestamp(),
            paymentStatus: "COMPLETED"
          });
          
          console.log("Updated existing order:", {
            orderId: orderDoc.id,
            orderNumber: orderDoc.data()?.orderNumber,
            paymentId,
            status: "completed"
          });
          
          response.status(200).json({
            success: true,
            action: "updated",
            orderId: orderDoc.id,
            orderNumber: orderDoc.data()?.orderNumber,
            message: "Order updated successfully"
          });
          return;
        }
      }

      // Verify webhook signature - critical security check
      const signature = request.headers["x-square-signature"] as string;
      const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";
      
      // Debug logging for signature verification
      console.log("Signature verification debug:", {
        signature: signature,
        signatureLength: signature?.length || 0,
        webhookKeyPresent: !!webhookSignatureKey,
        webhookKeyLength: webhookSignatureKey.length || 0,
        bodyPreview: JSON.stringify(request.body).substring(0, 100) + "...",
        rawBodyPresent: !!(request as any).rawBody,
        rawBodyLength: (request as any).rawBody?.length || 0,
        rawBodyPreview: (request as any).rawBody?.toString().substring(0, 100) + "...",
        requestUrl: request.url,
        isEmulator: process.env.FUNCTIONS_EMULATOR === 'true'
      });
      
      // Verify signature with emulator fallback
      const signatureValid = verifySquareSignature(request, signature, webhookSignatureKey);
      
      // In emulator mode, allow requests with warning if signature fails
      if (!signatureValid) {
        if (process.env.FUNCTIONS_EMULATOR === 'true') {
          console.warn("EMULATOR MODE: Allowing request despite invalid signature for testing");
          console.warn("This would be rejected in production!");
        } else {
          console.error("Invalid Square webhook signature - potential security breach");
          console.error("Signature verification failed");
          response.status(401).send("Unauthorized");
          return;
        }
      } else {
        console.log("Signature verified successfully");
      }

      // Generate order number
      const orderNumber = generateOrderNumber(paymentId);
      
      // Get location ID and map to cartId with validation
      const locationId = payload.data?.object?.payment?.location_id || "";
      const cartId = getCartIdFromLocation(locationId);

      // Create order in Firestore with optimized structure
      const orderData = {
        orderNumber,
        customerName: "", // Square doesn't provide customer name in webhook
        phoneNumber: "",
        orderDetails: "",
        status: "pending",
        color: "Online",
        source: "square",
        cartId,
        cartName: "Square Terminal",
        paymentId, // Store for reference
        locationId, // Store for reference
        createdAt: FieldValue.serverTimestamp(),
        processedAt: FieldValue.serverTimestamp(),
      };

      console.log("Creating order:", {
        orderNumber,
        cartId,
        paymentId,
        locationId,
        processingTime: `${Date.now() - startTime}ms`
      });
      
      const db = admin.firestore();
      const orderRef = await db.collection("orders").add(orderData);

      console.log("Order created successfully:", {
        orderId: orderRef.id,
        orderNumber,
        paymentId,
        locationId,
        totalProcessingTime: `${Date.now() - startTime}ms`
      });

      response.status(200).json({
        success: true,
        orderId: orderRef.id,
        orderNumber,
        message: "Order created successfully"
      });
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      console.error("Error processing Square webhook:", {
        error: error.message,
        stack: error.stack,
        processingTime: `${processingTime}ms`,
        payload: JSON.stringify(request.body),
        headers: {
          'x-square-signature': request.headers['x-square-signature'],
          'content-type': request.headers['content-type'],
          'user-agent': request.headers['user-agent']
        }
      });
      
      // Don't expose internal errors to external callers
      response.status(500).json({
        success: false,
        error: "Internal Server Error",
        requestId: crypto.randomUUID() // For tracking
      });
    }
  }
);
