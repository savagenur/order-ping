import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
// TODO: Uncomment when ready to use Twilio
// import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
// import * as twilio from "twilio";

// Import notification functions
import { subscribeToNotifications, sendOrderReadyNotification, unsubscribeFromNotifications } from "./notifications";

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets (Required for v2 to handle API keys securely)
// const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
// const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
// const twilioPhoneNumber = defineSecret("TWILIO_PHONE_NUMBER");

/**
 * Helper: Format phone number to E.164
 */
// function toE164(phoneNumber: string): string {
//   const digits = phoneNumber.replace(/\D/g, "");
//   if (digits.length === 10) return `+1${digits}`;
//   if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
//   return phoneNumber.startsWith("+") ? phoneNumber : `+${digits}`;
// }

/**
 * 1. Send SMS when order is READY
 */
export const sendOrderReadySMS = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "us-west1",
    // secrets: [twilioAccountSid, twilioAuthToken, twilioPhoneNumber],
  },
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) return null;

    if (newData.status === "ready" && previousData.status !== "ready") {
      // try {
      //   const client = twilio.default(
      //     twilioAccountSid.value(),
      //     twilioAuthToken.value(),
      //   );
      //   const formattedPhone = toE164(newData.phoneNumber);

      //   const message = newData.orderNumber
      //     ? `Hi ${newData.customerName}! Order #${newData.orderNumber} is ready at ${newData.cartName || "the cart"}! 🎉`
      //     : `Hi ${newData.customerName}! Your order is ready for pickup! 🎉`;

      //   const result = await client.messages.create({
      //     body: message,
      //     from: twilioPhoneNumber.value(),
      //     to: formattedPhone,
      //   });

      //   await event.data?.after.ref.update({
      //     smsSent: true,
      //     smsSentAt: admin.firestore.FieldValue.serverTimestamp(),
      //     smsId: result.sid,
      //   });
      // } catch (error: any) {
      //   console.error("SMS Error:", error.message);
      //   await event.data?.after.ref.update({
      //     smsSent: false,
      //     smsError: error.message,
      //   });
      // }
    }
    return null;
  },
);

/**
 * 2. Scheduled Cleanup (Daily at 2 AM)
 */
export const cleanupOldOrders = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "America/Los_Angeles",
    region: "us-west1",
  },
  async (event) => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await db
      .collection("orders")
      .where("status", "==", "completed")
      .where("completedAt", "<", thirtyDaysAgo)
      .get();

    const batch = db.batch();
    snapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // Cleanup completed successfully
  },
);

/**
 * 3. Create Worker (Callable Function)
 */
export const createWorker = onCall(
  {
    region: "us-west1",
    cors: [
      "http://localhost:5173", 
      "https://order-pingx.web.app", 
      "https://order-pingx.firebaseapp.com"
    ],
    // secrets: [twilioAccountSid, twilioAuthToken, twilioPhoneNumber],
  },
  async (request) => {
    // Check Auth & Admin Claims
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in.");
    }

    const caller = await admin.auth().getUser(request.auth!.uid);
    if (caller.customClaims?.role !== "admin" && caller.customClaims?.role !== "superadmin") {
      throw new HttpsError("permission-denied", "Admin access required.");
    }

    const { email, password, cartId, cartName, role } = request.data;

    try {
      const userRecord = await admin.auth().createUser({ email, password });

      await admin.auth().setCustomUserClaims(userRecord.uid, {
        cartId,
        cartName,
        role: role || "worker",
      });

      return { success: true, uid: userRecord.uid };
    } catch (error: any) {
      throw new HttpsError("internal", error.message);
    }
  },
);

export const makeMeAdmin = onCall(
  { region: "us-west1", cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login first!");

    await admin.auth().setCustomUserClaims(request.auth.uid, { role: "admin" });

    return { success: true, message: "You are now an admin locally!" };
  },
);

// Re-export notification functions
export { subscribeToNotifications, sendOrderReadyNotification, unsubscribeFromNotifications };
