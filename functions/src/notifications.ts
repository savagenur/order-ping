import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

// Initialize Firebase Admin
admin.initializeApp();

export const subscribeToNotifications = onCall(
  {
    region: "us-west1",
    cors: [
      "http://localhost:5173", 
      "https://order-pingx.web.app", 
      "https://order-pingx.firebaseapp.com"
    ],
  },
  async (request) => {
    const data = request.data;
    const context = request.auth ? { auth: request.auth } : { auth: null };
    
    // Allow both authenticated and anonymous users
    // Optional: Log who is subscribing
    if (context.auth) {
      console.log(`Authenticated user ${context.auth.uid} subscribing to notifications`);
    } else {
      console.log('Anonymous user subscribing to notifications');
    }

  const { orderId, fcmToken, userId } = data;

  if (!orderId || !fcmToken) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "orderId and fcmToken are required"
    );
  }

  try {
    const orderDoc = await admin.firestore().collection("orders").doc(orderId).get();
    
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }

    const orderData = orderDoc.data();

    if (orderData?.status === "ready") {
      throw new functions.https.HttpsError("failed-precondition", "Order is already ready!");
    }

    const existingSubscribers = orderData?.notificationSubscribers || [];
    const isAlreadySubscribed = existingSubscribers.some(
      (subscriber: any) => subscriber.fcmToken === fcmToken
    );

    const updateData: any = {};

    if (!isAlreadySubscribed) {
      const newSubscriber = {
        fcmToken,
        subscribedAt: new Date(),
        subscribedBy: context.auth?.uid || null,
      };
      updateData.notificationSubscribers = admin.firestore.FieldValue.arrayUnion(newSubscriber);
      updateData.isSubscribed = true;
      updateData.subscribedCount = existingSubscribers.length + 1;
    }

    // Write userId onto the order so sendOrderReadyNotification can look up
    // the FCM token from /users/{userId} — the primary push notification path.
    if (userId) {
      updateData.userId = userId;
    }

    if (Object.keys(updateData).length > 0) {
      await admin.firestore().collection("orders").doc(orderId).update(updateData);
    }

    return { success: true, message: "Successfully subscribed to notifications" };

  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    throw new functions.https.HttpsError("internal", "Failed to subscribe to notifications");
  }
});

export const unsubscribeFromNotifications = onCall(
  {
    region: "us-west1",
    cors: [
      "http://localhost:5173", 
      "https://order-pingx.web.app", 
      "https://order-pingx.firebaseapp.com"
    ],
  },
  async (request) => {
    const data = request.data;
    const context = request.auth ? { auth: request.auth } : { auth: null };
    
    // Allow both authenticated and anonymous users
    if (context.auth) {
      console.log(`Authenticated user ${context.auth.uid} unsubscribing from notifications`);
    } else {
      console.log('Anonymous user unsubscribing from notifications');
    }

    const { orderId, fcmToken } = data;

    if (!orderId || !fcmToken) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "orderId and fcmToken are required"
      );
    }

    try {
      // Get the order document
      const orderDoc = await admin.firestore().collection("orders").doc(orderId).get();
      
      if (!orderDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Order not found"
        );
      }

      const orderData = orderDoc.data();
      const existingSubscribers = orderData?.notificationSubscribers || [];
      
      // Find and remove the subscriber with this fcmToken
      const subscriberToRemove = existingSubscribers.find((subscriber: any) => subscriber.fcmToken === fcmToken);
      
      if (subscriberToRemove) {
        // Remove the subscriber from the array
        await admin.firestore().collection("orders").doc(orderId).update({
          notificationSubscribers: admin.firestore.FieldValue.arrayRemove(subscriberToRemove),
          subscribedCount: Math.max(0, existingSubscribers.length - 1),
          isSubscribed: existingSubscribers.length > 1
        });
        
        console.log(`Successfully unsubscribed token ${fcmToken} from order ${orderId}`);
        
        return {
          success: true,
          message: "Successfully unsubscribed from notifications"
        };
      } else {
        // Token not found in subscribers array
        console.log(`Token ${fcmToken} not found in subscribers for order ${orderId}`);
        
        return {
          success: true,
          message: "Token was not subscribed"
        };
      }

    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to unsubscribe from notifications"
      );
    }
  }
);

export const sendOrderReadyNotification = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "us-west1",
  },
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Only fire when status transitions to "ready"
    if (!afterData || beforeData?.status === "ready" || afterData.status !== "ready") {
      return;
    }

    const { orderNumber, customerName, cartName, cartId, color, userId } = afterData;
    const db = admin.firestore();

    // Collect FCM tokens to notify.
    // Primary: look up /users/{userId} for the registered PWA token.
    // Fallback: legacy notificationSubscribers array on the order doc.
    const tokensToNotify: string[] = [];

    if (userId) {
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const fcmToken = userDoc.data()?.fcmToken;
          if (fcmToken) {
            tokensToNotify.push(fcmToken);
            console.log(`[NOTIFY] Found fcmToken via /users/${userId}`);
          }
        }
      } catch (err) {
        console.error(`[NOTIFY] Failed to read /users/${userId}:`, err);
      }
    }

    // Fallback: legacy subscribers array (backward compat)
    if (
      tokensToNotify.length === 0 &&
      Array.isArray(afterData.notificationSubscribers) &&
      afterData.notificationSubscribers.length > 0
    ) {
      console.log(`[NOTIFY] Falling back to notificationSubscribers array`);
      for (const sub of afterData.notificationSubscribers) {
        if (sub.fcmToken && !tokensToNotify.includes(sub.fcmToken)) {
          tokensToNotify.push(sub.fcmToken);
        }
      }
    }

    if (tokensToNotify.length === 0) {
      console.log(`[NOTIFY] No tokens to notify for order ${event.params.orderId}`);
      return;
    }

    const buildMessage = (token: string) => ({
      token,
      data: {
        title: `Order #${orderNumber} ${color ?? ""} is Ready! 🎉`,
        body: cartName
          ? `Your order is ready for pickup at ${cartName}!`
          : `Your order is ready for pickup! 🎉`,
        orderId: event.params.orderId,
        orderNumber: String(orderNumber || ""),
        customerName: String(customerName || ""),
        cartName: String(cartName || ""),
        cartId: String(cartId || ""),
        type: "order_ready",
        icon: "/logox-small.png",
        badge: "/logox-small.png",
        tag: event.params.orderId,
        renotify: "true",
        requireInteraction: "true",
      },
      android: {
        notification: { icon: "/logox-small.png", color: "#F59E0B" },
      },
      webpush: { headers: { Urgency: "high" } },
    });

    const results = await Promise.allSettled(
      tokensToNotify.map(async (token) => {
        try {
          await admin.messaging().send(buildMessage(token));
          console.log(`[NOTIFY] Sent to token: ${token}`);
        } catch (error) {
          console.error(`[NOTIFY] Failed for token ${token}:`, error);
          // Remove stale token from /users/{userId} if it's the primary token
          if (
            error instanceof Error &&
            error.message.includes("registration-token-not-registered") &&
            userId
          ) {
            await db.collection("users").doc(userId).update({ fcmToken: admin.firestore.FieldValue.delete() });
            console.log(`[NOTIFY] Removed stale token from /users/${userId}`);
          }
        }
      }),
    );

    console.log(`[NOTIFY] Processed ${results.length} token(s) for order ${event.params.orderId}`);
  },
);
