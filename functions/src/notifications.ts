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
    }

    // Add userId to selectedUserIds array for proper tracking across all platforms
    if (userId) {
      updateData.selectedUserIds = admin.firestore.FieldValue.arrayUnion(userId);
    }

    // Calculate total subscribed count: notificationSubscribers + selectedUserIds (excluding duplicates)
    const currentSelectedUserIds = orderData?.selectedUserIds || [];
    const currentNotificationSubscribers = orderData?.notificationSubscribers || [];
    const uniqueUserIds = new Set([
      ...currentSelectedUserIds,
      ...currentNotificationSubscribers.map((s: any) => s.subscribedBy).filter(Boolean)
    ]);
    
    // Add the new userId to the count if it's not already included
    if (userId && !uniqueUserIds.has(userId)) {
      uniqueUserIds.add(userId);
    }
    
    updateData.subscribedCount = uniqueUserIds.size;

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

    const { orderId, fcmToken, userId } = data;

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
      const existingSelectedUserIds = orderData?.selectedUserIds || [];
      
      // Find and remove the subscriber with this fcmToken
      const subscriberToRemove = existingSubscribers.find((subscriber: any) => subscriber.fcmToken === fcmToken);
      
      const updateData: any = {};
      
      if (subscriberToRemove) {
        // Remove the subscriber from the array
        updateData.notificationSubscribers = admin.firestore.FieldValue.arrayRemove(subscriberToRemove);
      }
      
      // Remove userId from selectedUserIds if provided
      if (userId && existingSelectedUserIds.includes(userId)) {
        updateData.selectedUserIds = admin.firestore.FieldValue.arrayRemove(userId);
      }
      
      // Recalculate subscribed count
      if (Object.keys(updateData).length > 0) {
        // Calculate new count after removals
        const remainingSubscribers = subscriberToRemove 
          ? existingSubscribers.filter((s: any) => s.fcmToken !== fcmToken)
          : existingSubscribers;
          
        const remainingSelectedUserIds = userId && existingSelectedUserIds.includes(userId)
          ? existingSelectedUserIds.filter((id: string) => id !== userId)
          : existingSelectedUserIds;
          
        const uniqueUserIds = new Set([
          ...remainingSelectedUserIds,
          ...remainingSubscribers.map((s: any) => s.subscribedBy).filter(Boolean)
        ]);
        
        updateData.subscribedCount = uniqueUserIds.size;
        updateData.isSubscribed = uniqueUserIds.size > 0;
        
        await admin.firestore().collection("orders").doc(orderId).update(updateData);
        
        return {
          success: true,
          message: "Successfully unsubscribed from notifications"
        };
      } else {
        // No changes needed - token not found and userId not in selectedUserIds
        return {
          success: true,
          message: "No subscription changes needed"
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

      const message = {
        notification: {
          title: `Order #${orderData.orderNumber} is Ready! 🎉 `,
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


    // OPTIMIZATION: Query users with select() to fetch only fcmToken field
    // This reduces read quota by only fetching the field we need instead of entire documents
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('trackedOrderIds', 'array-contains', orderId)
      .select('fcmToken') // Only fetch fcmToken field to reduce quota usage
      .get();
    
    if (usersSnapshot.empty) {
      return;
    }

    // Extract user data from query result (no additional reads needed)
    const trackingUsers = usersSnapshot.docs
      .map(doc => ({
        userId: doc.id,
        fcmToken: doc.data()?.fcmToken
      }))
      .filter(user => user.fcmToken); // Filter out users without FCM tokens
    


    try {
      // Build notification message template with cart/location name
      const cartName = orderData.cartName || 'Restaurant';
      
      const notificationData = {
        // Notification content - includes cart/location name
        title: `${cartName} - Order #${orderData.orderNumber} is Ready! 🎉`,
        body: orderData.customerName 
          ? `${orderData.customerName}, your order at ${cartName} is ready for pickup!` 
          : `Your order at ${cartName} is ready! Please come to the counter for pickup. ✨`,
        // Order data
        orderId: String(orderId),
        orderNumber: String(orderData.orderNumber || ''),
        customerName: String(orderData.customerName || ''),
        cartName: String(cartName),
        cartId: String(orderData.cartId || ''),
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
      };

      // Send notifications to all users tracking this order
      // OPTIMIZATION: No additional Firestore reads - we already have fcmToken from initial query
      const notificationPromises = trackingUsers.map(async ({ userId, fcmToken }) => {
        try {
          // Build message for this user with deep link to queue page
          const message = {
            token: fcmToken,
            data: {
              ...notificationData,
              // Deep link: clicking notification opens /queue?cart={cartId}
              clickAction: `/queue?cart=${orderData.cartId || ''}`,
              url: `/queue?cart=${orderData.cartId || ''}`
            }
          };

          // Send notification to PWA
          await admin.messaging().send(message);
          
        } catch (error) {
          // Check for specific Firebase Messaging errors
          const messagingError = error as any;
          if (messagingError.code === 'messaging/registration-token-not-registered') {
            // Note: We don't cleanup here to avoid extra write quota
            // The client will handle token refresh on next app load
          } else {
            console.error(`[NOTIFY] Error sending to user:`, error);
          }
        }
      });

      // Wait for all notifications to be sent
      await Promise.all(notificationPromises);
      
    } catch (error) {
      console.error(`[NOTIFY] Error in sendOrderReadyNotification:`, error);
    }
    
  }
);

export const cleanupUserOrderReference = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "us-west1",
  },
  async (event) => {
    const beforeData = event.data?.before?.data();
    const orderData = event.data?.after?.data();

    // Only process when status changes to "completed"
    if (!orderData || !beforeData || beforeData.status === orderData.status) {
      return;
    }

    if (orderData.status !== "completed" || beforeData?.status !== "ready") {
      return;
    }

    const selectedUserIds = orderData.selectedUserIds || [];
    if (selectedUserIds.length === 0) {
      return;
    }

    try {
      // Clean up selectedOrderId from ALL users who selected this order
      const batch = admin.firestore().batch();
      
      selectedUserIds.forEach((userId: string) => {
        const userRef = admin.firestore().collection('users').doc(userId);
        batch.update(userRef, {
          selectedOrderId: admin.firestore.FieldValue.delete()
        });
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Failed to cleanup user order references:`, error);
    }
  }
);
