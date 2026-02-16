import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as twilio from "twilio";

// Initialize Firebase Admin
admin.initializeApp();

// Get Twilio credentials from environment variables (modern approach)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Only initialize Twilio if config is available
let twilioClient: twilio.Twilio | null = null;
if (accountSid && authToken) {
  twilioClient = twilio.default(accountSid, authToken);
}

/**
 * Format phone number to E.164 format for Twilio
 * Converts (555) 123-4567 to +15551234567
 */
function toE164(phoneNumber: string): string {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, "");

  // Add +1 for US numbers (assumes 10 digit US numbers)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already has country code, just add +
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Return as-is if it's already in a valid format
  return phoneNumber;
}

/**
 * Send SMS notification when order is marked as ready
 * Triggers on order status change to 'ready'
 */
export const sendOrderReadySMS = functions
  .region("us-west1")
  .firestore.document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();

    // Check if status changed to 'ready'
    if (newData.status === "ready" && previousData.status !== "ready") {
      // Check if Twilio is configured
      if (!twilioClient || !twilioPhone) {
        console.warn(
          "Twilio not configured. Skipping SMS notification.",
          "Create .env.local file in functions/ with: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
        );
        return null;
      }

      const customerName = newData.customerName;
      const phoneNumber = newData.phoneNumber;
      const orderNumber = newData.orderNumber || "";
      const cartName = newData.cartName || "Your food cart";

      try {
        // Format phone number to E.164
        const formattedPhone = toE164(phoneNumber);

        // Create message with order number
        const message = orderNumber
          ? `Hi ${customerName}! Order #${orderNumber} is ready for pickup at ${cartName}! 🎉`
          : `Hi ${customerName}! Your order is ready for pickup at ${cartName}! 🎉`;

        // Send SMS via Twilio
        const result = await twilioClient.messages.create({
          body: message,
          from: twilioPhone,
          to: formattedPhone,
        });

        console.log(`SMS sent successfully to ${formattedPhone}`, {
          sid: result.sid,
          status: result.status,
          orderId: context.params.orderId,
          orderNumber: orderNumber,
          customerName: customerName,
        });

        // Optional: Update order with SMS status
        await change.after.ref.update({
          smsSent: true,
          smsSentAt: admin.firestore.FieldValue.serverTimestamp(),
          smsId: result.sid,
        });

        return {success: true, messageSid: result.sid};
      } catch (error: any) {
        console.error("Error sending SMS:", {
          error: error.message,
          code: error.code,
          orderId: context.params.orderId,
          phoneNumber: phoneNumber,
        });

        // Update order with error status
        await change.after.ref.update({
          smsSent: false,
          smsError: error.message,
          smsErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Don't throw - we don't want to retry on permanent failures
        return {success: false, error: error.message};
      }
    }

    return null;
  });

/**
 * Optional: Send confirmation SMS when order is created
 * Uncomment to enable order confirmation messages
 */
/*
export const sendOrderConfirmationSMS = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snapshot, context) => {
    if (!twilioClient || !twilioPhone) {
      console.warn("Twilio not configured. Skipping SMS notification.");
      return null;
    }

    const data = snapshot.data();
    const customerName = data.customerName;
    const phoneNumber = data.phoneNumber;
    const orderNumber = data.orderNumber || "";
    const cartName = data.cartName || "Your food cart";

    try {
      const formattedPhone = toE164(phoneNumber);

      const message = orderNumber
        ? `Thanks ${customerName}! Your order #${orderNumber} has been received at ${cartName}. We'll text you when it's ready!`
        : `Thanks ${customerName}! Your order has been received at ${cartName}. We'll text you when it's ready!`;

      const result = await twilioClient.messages.create({
        body: message,
        from: twilioPhone,
        to: formattedPhone,
      });

      console.log(`Confirmation SMS sent to ${formattedPhone}`, {
        sid: result.sid,
        orderId: context.params.orderId,
      });

      await snapshot.ref.update({
        confirmationSmsSent: true,
        confirmationSmsSentAt: admin.firestore.FieldValue.serverTimestamp(),
        confirmationSmsId: result.sid,
      });

      return {success: true, messageSid: result.sid};
    } catch (error: any) {
      console.error("Error sending confirmation SMS:", error.message);
      return {success: false, error: error.message};
    }
  });
*/

/**
 * Optional: Scheduled function to clean up old completed orders
 * Runs daily to delete orders older than 30 days
 */
export const cleanupOldOrders = functions
  .region("us-west1")
  .pubsub.schedule("0 2 * * *") // Runs at 2 AM every day
  .timeZone("America/Los_Angeles") // Adjust to your timezone
  .onRun(async (context) => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const snapshot = await db
        .collection("orders")
        .where("status", "==", "completed")
        .where("completedAt", "<", thirtyDaysAgo)
        .get();

      const batch = db.batch();
      let count = 0;

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();

      console.log(`Cleaned up ${count} old completed orders`);
      return {deletedCount: count};
    } catch (error: any) {
      console.error("Error cleaning up old orders:", error.message);
      return {error: error.message};
    }
  });