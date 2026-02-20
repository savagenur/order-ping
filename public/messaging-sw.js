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
        actions: [
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
          type: payload.data?.type || 'order_ready'
        }
      };


      // Show the notification
      return self.registration.showNotification(notificationTitle, notificationOptions);
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

  event.notification.close();

  // Handle different actions
  if (event.action === 'view-order') {
    // Open the app to the specific order
    const orderId = event.notification.data?.orderId;
    const urlToOpen = orderId ? `/?order=${orderId}` : '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus on existing window if available
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Otherwise open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
