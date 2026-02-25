import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
// TODO: Uncomment when ready to use Twilio
// import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
// import * as twilio from "twilio";

// Import notification functions
import { subscribeToNotifications, sendOrderReadyNotification, unsubscribeFromNotifications, cleanupUserOrderReference } from "./notifications";

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
 * 1. Scheduled Cleanup (Daily at 2 AM)
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

/**
 * registerDeviceToken — maps an anonymous userId to an FCM token.
 * Called by the PWA on launch after push permission is granted.
 * Writes to /device_tokens/{userId}.
 */
export const registerDeviceToken = onCall(
  {
    region: "us-west1",
    cors: [
      "http://localhost:5173",
      "https://order-pingx.web.app",
      "https://order-pingx.firebaseapp.com",
    ],
  },
  async (request) => {
    const { userId, fcmToken, userAgent } = request.data;

    if (!userId || !fcmToken) {
      throw new HttpsError("invalid-argument", "userId and fcmToken are required");
    }

    const db = admin.firestore();
    await db.collection("device_tokens").doc(userId).set(
      {
        fcmToken,
        userId,
        userAgent: userAgent || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

        return { success: true };
  },
);

// Re-export notification functions
export { subscribeToNotifications, sendOrderReadyNotification, unsubscribeFromNotifications, cleanupUserOrderReference };
