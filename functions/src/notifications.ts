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

    // Check if order is still preparing
    if (orderData?.status === "ready") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Order is already ready!"
      );
    }

    // Update the order with notification token
    const updateData: any = {
      notificationToken: fcmToken,
      isSubscribed: true,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add user info if authenticated
    if (context.auth) {
      updateData.subscribedBy = context.auth.uid;
    }
    
    await admin.firestore().collection("orders").doc(orderId).update(updateData);

    return {
      success: true,
      message: "Successfully subscribed to notifications"
    };

  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to subscribe to notifications"
    );
  }
});

export const sendOrderReadyNotification = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "us-west1",
  },
  async (event) => {
  const beforeData = event.data?.before?.data();
  const afterData = event.data?.after?.data();
  
  
  // Check if status changed from pending/preparing to ready
  if (
    beforeData?.status !== "ready" && 
    afterData?.status === "ready" && 
    afterData?.isSubscribed && 
    afterData?.notificationToken
  ) {
    const { notificationToken, orderNumber, customerName, cartName, color } = afterData;
    
    const message = {
      token: notificationToken,
      data: {
        title: `Order #${orderNumber} ${color} is Ready! 🎉`,
        body: cartName 
          ? `Your order is ready for pickup at ${cartName || "the cart"}!`
          : `Your order is ready for pickup! 🎉`,
        orderId: event.params.orderId,
        orderNumber: String(orderNumber || ''),
        customerName: String(customerName || ''),
        cartName: String(cartName || ''),
        type: 'order_ready',
        icon: '/logox-small.png',
        badge: '/logox-small.png',
        tag: event.params.orderId,
        renotify: 'true',
        requireInteraction: 'true'
      },
      android: {
        notification: {
          icon: '/logox-small.png',
          color: '#F59E0B',
        }
      },
      webpush: {
        headers: {
          Urgency: "high"
        }
      }
    };

    try {
      await admin.messaging().send(message);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  } else {
    // Conditions not met for sending notification
  }
});
