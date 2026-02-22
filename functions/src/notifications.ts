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

    console.log(`[NOTIFY_DIRECT] ===== DIRECT NOTIFICATION REQUEST =====`);
    console.log(`[NOTIFY_DIRECT] Order: ${orderData.orderNumber} (${orderData.id})`);
    console.log(`[NOTIFY_DIRECT] User: ${userId}`);
    console.log(`[NOTIFY_DIRECT] Token: ${fcmToken.substring(0, 20)}...`);

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

      console.log(`[NOTIFY_DIRECT] Sending notification:`, JSON.stringify(message, null, 2));

      // Send the notification
      const response = await admin.messaging().send(message);
      
      console.log(`[NOTIFY_DIRECT] ✅ Notification sent successfully!`);
      console.log(`[NOTIFY_DIRECT] Response:`, JSON.stringify(response, null, 2));

      return { 
        success: true, 
        messageId: response,
        message: "Notification sent successfully"
      };

    } catch (error) {
      console.error(`[NOTIFY_DIRECT] ❌ Error sending notification:`, error);
      
      if (error instanceof Error) {
        console.error(`[NOTIFY_DIRECT] Error details:`, error.message);
      }

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
    const timestamp = new Date().toISOString();
    console.log(`[NOTIFY] ===== NOTIFICATION TRIGGERED =====`);
    console.log(`[NOTIFY] Timestamp: ${timestamp}`);
    console.log(`[NOTIFY] Event ID: ${event.id}`);
    console.log(`[NOTIFY] Order ID: ${orderId}`);
    console.log(`[NOTIFY] Status change: "${beforeData?.status}" → "${orderData?.status}"`);

    const userId = orderData.userId;
    
    if (!userId) {
      console.log(`[NOTIFY] No userId in order ${orderId}, skipping`);
      console.log(`[NOTIFY] Available fields in order:`, Object.keys(orderData || {}));
      return;
    }

    console.log(`[NOTIFY] Processing notification for userId: ${userId}`);

    try {
      // 1. Get user document to find PWA FCM token
      console.log(`[NOTIFY] Step 1: Fetching user document for userId: ${userId}`);
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`[NOTIFY] User ${userId} not found in Firestore`);
        return;
      }

      const userData = userDoc.data();
      console.log(`[NOTIFY] User document data:`, JSON.stringify(userData, null, 2));

      const targetToken = userData?.fcmToken;

      if (!targetToken) {
        console.log(`[NOTIFY] User ${userId} has no FCM token (PWA not installed)`);
        console.log(`[NOTIFY] User document fields:`, Object.keys(userData || {}));
        return;
      }

      console.log(`[NOTIFY] Found PWA token for user ${userId}: ${targetToken.substring(0, 20)}...`);

      // 2. Build data-only message for PWA (no notification field to prevent duplicates)
      // The service worker will handle showing the notification with full customization
      const color = orderData.color || '';
      const message = {
        token: targetToken, // Send directly to PWA token
        data: {
          // Notification content
          title: `Order #${orderData.orderNumber} ${color} is Ready! 🎉 `,
          body: orderData.customerName 
            ? `${orderData.customerName}, your order is ready for pickup!` 
            : `Order #${orderData.orderNumber} is ready for pickup!`,
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

      console.log(`[NOTIFY] Step 2: Built notification message:`, JSON.stringify(message, null, 2));

      // 3. Send notification to PWA
      console.log(`[NOTIFY] Step 3: Sending push notification to token: ${targetToken.substring(0, 20)}...`);
      
      const response = await admin.messaging().send(message);
      console.log(`[NOTIFY] ✅ Push notification sent successfully to PWA!`);
      console.log(`[NOTIFY] Firebase response:`, JSON.stringify(response, null, 2));
      console.log(`[NOTIFY] Message ID: ${response}`);
      
    } catch (error) {
      console.error(`[NOTIFY] ❌ Error sending notification to PWA:`, error);
      console.error(`[NOTIFY] Error details:`, JSON.stringify(error, null, 2));
      
      // Check for specific Firebase Messaging errors
      const messagingError = error as any;
      if (messagingError.code === 'messaging/registration-token-not-registered') {
        console.log(`[NOTIFY] 🧹 Token is no longer registered, cleaning up stale token`);
        
        // Get the stale token from the user document before cleanup
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const staleToken = userDoc.data()?.fcmToken;
        
        // Remove stale token from user document
        try {
          await admin.firestore().collection('users').doc(userId).update({
            fcmToken: admin.firestore.FieldValue.delete()
          });
          console.log(`[NOTIFY] ✅ Cleaned up stale token for user ${userId}`);
        } catch (cleanupError) {
          console.error(`[NOTIFY] ❌ Failed to clean up stale token:`, cleanupError);
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
                console.log(`[NOTIFY] ✅ Removed stale subscriber from order ${orderId}`);
              }
            }
          } catch (orderCleanupError) {
            console.error(`[NOTIFY] ❌ Failed to clean up order subscriber:`, orderCleanupError);
          }
        }
      }
      
      // Log specific error types
      if (error instanceof Error) {
        console.error(`[NOTIFY] Error name: ${error.name}`);
        console.error(`[NOTIFY] Error message: ${error.message}`);
        console.error(`[NOTIFY] Error stack: ${error.stack}`);
      }
      
      if (messagingError.code) {
        console.error(`[NOTIFY] Firebase error code: ${messagingError.code}`);
        console.error(`[NOTIFY] Firebase error info:`, messagingError.errorInfo);
      }
    }
    
    console.log(`[NOTIFY] ===== NOTIFICATION PROCESS COMPLETE =====`);
  }
);
