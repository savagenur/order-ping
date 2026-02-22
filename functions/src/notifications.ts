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
    
    // Allow both authenticated and anonymous users

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
        
        
        return {
          success: true,
          message: "Successfully unsubscribed from notifications"
        };
      } else {
        // Token not found in subscribers array
        
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

export const sendOrderReadyNotificationDirect = onCall(
  {
    region: "us-west1",
    cors: [
      "http://localhost:5173", 
      "https://order-pingx.web.app", 
      "https://order-pingx.firebaseapp.com"
    ],
  },
  async (request) => {
    const { orderData, userId, fcmToken } = request.data;


    if (!orderData || !userId || !fcmToken) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "orderData, userId, and fcmToken are required"
      );
    }

    try {
      // Build enhanced notification message with rich content
      const color = orderData.color || '';
      const message = {
        notification: {
          title: `Order #${orderData.orderNumber} ${color} is Ready! 🎉 `,
          body: orderData.customerName 
            ? `${orderData.customerName}, your order is ready for pickup!` 
            : `Your order is ready! Please come to the counter for pickup. ✨`,
        },
        token: fcmToken,
        data: {
          orderId: String(orderData.id),
          orderNumber: String(orderData.orderNumber || ''),
          customerName: String(orderData.customerName || ''),
          cartName: String(orderData.cartName || ''),
          type: 'order_ready',
          // Rich notification data for service worker
          icon: '/logox-small.png',
          badge: '/logox-small.png',
          tag: `order-${orderData.id}`, // Unique tag to prevent duplicates
          renotify: 'true',
          requireInteraction: 'true',
          // Actions data
          actions: JSON.stringify([
            { action: 'view-order', title: 'View Order' },
            { action: 'dismiss', title: 'Dismiss' }
          ])
        }
      };


      // Send the notification
      await admin.messaging().send(message);
      

      return { 
        success: true, 
        message: "Notification sent successfully"
      };

    } catch (error) {
      console.error(`[NOTIFY_DIRECT] ❌ Error sending notification:`, error);
      

      throw new functions.https.HttpsError(
        "internal",
        "Failed to send notification"
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
    const orderId = event.params.orderId;
    const beforeData = event.data?.before?.data();
    const orderData = event.data?.after?.data();

    // Early exit: Only process if status field actually changed
    // This prevents unnecessary function invocations when only subscription fields change
    if (!orderData || !beforeData || beforeData.status === orderData.status) {
      return;
    }

    // Only fire when status transitions to "ready"
    if (beforeData?.status === "ready" || orderData.status !== "ready") {
      return;
    }

    // Add timestamp to track when notifications are actually sent

    const userId = orderData.userId;
    
    if (!userId) {
      return;
    }


    try {
      // 1. Get user document to find PWA FCM token
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return;
      }

      const userData = userDoc.data();

      const targetToken = userData?.fcmToken;

      if (!targetToken) {
        return;
      }


      // 2. Build data-only message for PWA (no notification field to prevent duplicates)
      // The service worker will handle showing the notification with full customization
      const color = orderData.color || '';
      const message = {
        token: targetToken, // Send directly to PWA token
        data: {
          // Notification content
          title: `Order #${orderData.orderNumber} ${color} is Ready! 🎉 `,
          body:orderData.customerName 
            ? `${orderData.customerName}, your order is ready for pickup!` 
            : `Your order is ready! Please come to the counter for pickup. ✨`,
          // Order data
          orderId: String(orderId),
          orderNumber: String(orderData.orderNumber || ''),
          customerName: String(orderData.customerName || ''),
          cartName: String(orderData.cartName || ''),
          type: 'order_ready',
          // Rich notification data for service worker
          icon: '/logox-small.png',
          badge: '/logox-small.png',
          tag: `order-${orderId}`, // Unique tag to prevent duplicates
          renotify: 'true',
          requireInteraction: 'true',
          // Actions data
          actions: JSON.stringify([
            { action: 'view-order', title: 'View Order' },
            { action: 'dismiss', title: 'Dismiss' }
          ])
        }
      };


      // 3. Send notification to PWA
      await admin.messaging().send(message);
      
    } catch (error) {
      
      // Check for specific Firebase Messaging errors
      const messagingError = error as any;
      if (messagingError.code === 'messaging/registration-token-not-registered') {
        
        // Get the stale token from the user document before cleanup
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const staleToken = userDoc.data()?.fcmToken;
        
        // Remove stale token from user document
        try {
          await admin.firestore().collection('users').doc(userId).update({
            fcmToken: admin.firestore.FieldValue.delete()
          });
        } catch (cleanupError) {
        }
        
        // Also remove from order subscribers if present
        if (staleToken) {
          try {
            const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
            if (orderDoc.exists) {
              const orderData = orderDoc.data();
              const subscribers = orderData?.notificationSubscribers || [];
              const staleSubscriber = subscribers.find((sub: any) => sub.fcmToken === staleToken);
              
              if (staleSubscriber) {
                await admin.firestore().collection('orders').doc(orderId).update({
                  notificationSubscribers: admin.firestore.FieldValue.arrayRemove(staleSubscriber),
                  subscribedCount: Math.max(0, subscribers.length - 1),
                  isSubscribed: subscribers.length > 1
                });
              }
            }
          } catch (orderCleanupError) {
          }
        }
      }
      
    }
    
  }
);

export const cleanupUserOrderReference = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "us-west1",
  },
  async (event) => {
    const orderId = event.params.orderId;
    const beforeData = event.data?.before?.data();
    const orderData = event.data?.after?.data();

    // Only process when status changes to "completed"
    if (!orderData || !beforeData || beforeData.status === orderData.status) {
      return;
    }

    if (orderData.status !== "completed" || beforeData?.status !== "ready") {
      return;
    }

    const userId = orderData.userId;
    if (!userId) {
      return;
    }

    try {
      // Clean up the user's selectedOrderId reference
      await admin.firestore().collection('users').doc(userId).update({
        selectedOrderId: admin.firestore.FieldValue.delete()
      });
      
      console.log(`✅ [CLEANUP] Removed orderId ${orderId} from user ${userId}`);
    } catch (error) {
      console.error(`❌ [CLEANUP] Failed to cleanup user order reference:`, error);
    }
  }
);
