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

    // Get existing subscribers or initialize empty array
    const existingSubscribers = orderData?.notificationSubscribers || [];
    
    // Check if this token is already subscribed
    const isAlreadySubscribed = existingSubscribers.some((subscriber: any) => subscriber.fcmToken === fcmToken);
    
    if (!isAlreadySubscribed) {
      // Add new subscriber to the array
      const newSubscriber = {
        fcmToken,
        subscribedAt: new Date(),
        subscribedBy: context.auth?.uid || null
      };
      
      // Update the order with notification subscribers array
      const updateData: any = {
        notificationSubscribers: admin.firestore.FieldValue.arrayUnion(newSubscriber),
        isSubscribed: true,
        subscribedCount: existingSubscribers.length + 1
      };
      
      await admin.firestore().collection("orders").doc(orderId).update(updateData);
    }

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
  
  
  // Check if status changed from pending/preparing to ready
  if (
    beforeData?.status !== "ready" && 
    afterData?.status === "ready" && 
    afterData?.isSubscribed && 
    afterData?.notificationSubscribers &&
    Array.isArray(afterData.notificationSubscribers) &&
    afterData.notificationSubscribers.length > 0
  ) {
    const { notificationSubscribers, orderNumber, customerName, cartName, cartId, color } = afterData;
    
    // Send notifications to all subscribers
    const notificationPromises = notificationSubscribers.map(async (subscriber: any) => {
      const message = {
        token: subscriber.fcmToken,
        data: {
          title: `Order #${orderNumber} ${color} is Ready! 🎉`,
          body: cartName 
            ? `Your order is ready for pickup at ${cartName || "the cart"}!`
            : `Your order is ready for pickup! 🎉`,
          orderId: event.params.orderId,
          orderNumber: String(orderNumber || ''),
          customerName: String(customerName || ''),
          cartName: String(cartName || ''),
          cartId: String(cartId || ''),
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
        console.log(`Notification sent successfully to token: ${subscriber.fcmToken}`);
      } catch (error) {
        console.error(`Error sending notification to token ${subscriber.fcmToken}:`, error);
        // Optionally: Remove invalid tokens from the array
        if (error instanceof Error && error.message.includes('registration-token-not-registered')) {
          console.log(`Removing invalid token: ${subscriber.fcmToken}`);
          await admin.firestore().collection("orders").doc(event.params.orderId).update({
            notificationSubscribers: admin.firestore.FieldValue.arrayRemove(subscriber),
            subscribedCount: Math.max(0, (afterData.subscribedCount || 1) - 1)
          });
        }
      }
    });

    // Send all notifications in parallel
    await Promise.allSettled(notificationPromises);
    console.log(`Processed ${notificationSubscribers.length} notifications for order ${event.params.orderId}`);
  } else {
    // Conditions not met for sending notification
  }
});
