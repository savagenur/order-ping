import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as twilio from "twilio";

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets from Secret Manager
const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = defineSecret("TWILIO_PHONE_NUMBER");

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
export const sendOrderReadySMS = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "us-west1",
    secrets: [twilioAccountSid, twilioAuthToken, twilioPhoneNumber],
  },
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) {
      return null;
    }

    // Check if status changed to 'ready'
    if (newData.status === "ready" && previousData.status !== "ready") {
      try {
        // Initialize Twilio client with secrets
        const twilioClient = twilio.default(
          twilioAccountSid.value(),
          twilioAuthToken.value()
        );

        const customerName = newData.customerName;
        const phoneNumber = newData.phoneNumber;
        const orderNumber = newData.orderNumber || "";
        const cartName = newData.cartName || "Your food cart";

        // Format phone number to E.164
        const formattedPhone = toE164(phoneNumber);

        // Create message with order number
        const message = orderNumber
          ? `Hi ${customerName}! Order #${orderNumber} is ready for pickup at ${cartName}! 🎉`
          : `Hi ${customerName}! Your order is ready for pickup at ${cartName}! 🎉`;

        // Send SMS via Twilio
        const result = await twilioClient.messages.create({
          body: message,
          from: twilioPhoneNumber.value(),
          to: formattedPhone,
        });

        console.log(`SMS sent successfully to ${formattedPhone}`, {
          sid: result.sid,
          status: result.status,
          orderId: event.params.orderId,
          orderNumber: orderNumber,
          customerName: customerName,
        });

        // Update order with SMS status
        if (event.data) {
          await event.data.after.ref.update({
            smsSent: true,
            smsSentAt: admin.firestore.FieldValue.serverTimestamp(),
            smsId: result.sid,
          });
        }

        return {success: true, messageSid: result.sid};
      } catch (error: any) {
        console.error("Error sending SMS:", {
          error: error.message,
          code: error.code,
          orderId: event.params.orderId,
          phoneNumber: newData.phoneNumber,
        });

        // Update order with error status
        if (event.data) {
          await event.data.after.ref.update({
            smsSent: false,
            smsError: error.message,
            smsErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        return {success: false, error: error.message};
      }
    }

    return null;
  }
);

/**
 * Optional: Scheduled function to clean up old completed orders
 * Runs daily to delete orders older than 30 days
 */
export const cleanupOldOrders = onSchedule(
  {
    schedule: "0 2 * * *", // Runs at 2 AM every day
    timeZone: "America/Los_Angeles",
    region: "us-west1",
  },
  async (event) => {
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
    } catch (error: any) {
      console.error("Error cleaning up old orders:", error.message);
    }
  }
);