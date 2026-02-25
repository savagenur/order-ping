// Service Worker for OrderPing Push Notifications

// Import Firebase scripts with error handling
try {
  importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');
} catch (error) {
  console.error('Failed to import Firebase scripts:', error);
}

// Initialize Firebase in the service worker
let messaging = null;
try {
  const firebaseConfig = {
    apiKey: "__VITE_FIREBASE_API_KEY__",
    authDomain: "__VITE_FIREBASE_AUTH_DOMAIN__",
    projectId: "__VITE_FIREBASE_PROJECT_ID__",
    storageBucket: "__VITE_FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__VITE_FIREBASE_APP_ID__"
  };

  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('🔔 Background message received:', payload);
      console.log('📦 Message data:', payload.data);
      console.log('📦 Message notification:', payload.notification);

      // Extract notification data from payload.data (data-only message)
      const title = payload.data?.title;
      const body = payload.data?.body;
      
      const notificationTitle = title || payload.notification?.title || 'OrderPing';
      const notificationOptions = {
        body: body || payload.notification?.body || 'Your order status has been updated.',
        icon: payload.data?.icon || '/logox-small.png',
        badge: payload.data?.badge || '/logox-small.png',
        tag: payload.data?.tag || payload.data?.orderId || 'order-update',
        renotify: payload.data?.renotify === 'true',
        requireInteraction: payload.data?.requireInteraction === 'true',
        // Parse actions from JSON string if provided
        actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [
          {
            action: 'view-order',
            title: 'View Order'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: {
          orderId: payload.data?.orderId,
          orderNumber: payload.data?.orderNumber,
          customerName: payload.data?.customerName,
          cartName: payload.data?.cartName,
          cartId: payload.data?.cartId, // Use cartId for navigation
          type: payload.data?.type || 'order_ready',
          clickAction: payload.data?.clickAction,
          url: payload.data?.url
        }
      };

      console.log('🎯 Showing enhanced notification:', notificationTitle, notificationOptions);
      
      try {
        const notificationResult = self.registration.showNotification(notificationTitle, notificationOptions);
        console.log('✅ Enhanced notification show result:', notificationResult);
        return notificationResult;
      } catch (error) {
        console.error('❌ Error showing enhanced notification:', error);
        throw error;
      }
    });

    // Handle token refresh (only if available)
    if (messaging.onTokenRefresh) {
      messaging.onTokenRefresh(() => {
      });
    }
  }
} catch (error) {
  console.error('Firebase initialization failed in service worker:', error);
}

// Handle notification clicks (works even if Firebase fails)
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  console.log('📊 Notification data:', event.notification.data);

  event.notification.close();

  // Handle different actions
  if (event.action === 'view-order' || !event.action) {
    // Open the app to the cart queue
    const clickAction = event.notification.data?.clickAction || event.notification.data?.url;
    const cartId = event.notification.data?.cartId;
    const orderId = event.notification.data?.orderId;
    
    console.log('🎯 Opening app with clickAction:', clickAction, 'cartId:', cartId, 'orderId:', orderId);
    
    // Use clickAction/url if provided, otherwise build URL with cart parameter
    let urlToOpen = clickAction || '/queue';
    if (!clickAction && cartId) {
      urlToOpen = `/queue?cart=${cartId}`;
    }
    
    console.log('🚀 Opening URL:', urlToOpen);
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus on existing window if available
          for (const client of clientList) {
            if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
              console.log('📱 Focusing existing client:', client.url);
              return client.focus();
            }
          }
          // Otherwise open new window
          if (clients.openWindow) {
            console.log('🪟 Opening new window:', urlToOpen);
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('🚫 Dismissed notification');
    return;
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(self.clients.claim());
  console.log('✅ Service Worker activated and claimed clients');
});

// Add message listener for debugging
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'TEST_MESSAGE') {
    console.log('🧪 Test message received, responding...');
    event.ports[0]?.postMessage({ type: 'TEST_RESPONSE', received: true });
  }
});
