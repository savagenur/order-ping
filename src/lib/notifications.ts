import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface NotificationSubscriptionResult {
  success: boolean;
  error?: string;
  token?: string;
}

// Cache for FCM token to avoid repeated requests
let cachedFCMToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

// Store token in localStorage for persistence
const FCM_TOKEN_KEY = 'orderping_fcm_token';

/**
 * Get cached FCM token or fetch new one with caching
 */
async function getCachedFCMToken(forceRefresh = false): Promise<string | null> {
  // Force refresh if requested
  if (forceRefresh) {
    cachedFCMToken = null;
    tokenPromise = null;
    localStorage.removeItem(FCM_TOKEN_KEY);
  }
  
  // Return cached token if available
  if (cachedFCMToken) {
    return cachedFCMToken;
  }
  
  // Check localStorage for persistent token
  const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
  if (storedToken && !forceRefresh) {
    cachedFCMToken = storedToken;
    return storedToken;
  }
  
  // If token request is in progress, return the existing promise
  if (tokenPromise) {
    return tokenPromise;
  }
  
  // Create new token request promise
  tokenPromise = (async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const { getToken } = await import('firebase/messaging');
      const { getMessaging } = await import('firebase/messaging');
      
      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: "BEe09hbvQNef0u4fgmfMN_pRuhFsGY9W9QQQyR5OYs-YcriXv7O4dR1YSWa1kGo05aZR0IbdxTDHF9gMX5bqeaI",
        serviceWorkerRegistration: registration
      });
      
      if (token) {
        cachedFCMToken = token;
        // Store in localStorage for persistence
        localStorage.setItem(FCM_TOKEN_KEY, token);
        console.log('🔔 [TOKEN] New FCM token generated and cached');
      } else {
        console.error('🔔 [TOKEN] Failed to get FCM token');
      }
      
      return token;
    } catch (error) {
      console.error('🔔 [TOKEN] Error getting FCM token:', error);
      return null;
    } finally {
      // Clear the promise after completion
      tokenPromise = null;
    }
  })();
  
  return tokenPromise;
}

/**
 * Clear cached token (call when token becomes invalid)
 */
export function clearCachedFCMToken(): void {
  cachedFCMToken = null;
  tokenPromise = null;
  localStorage.removeItem(FCM_TOKEN_KEY);
  console.log('🔔 [TOKEN] FCM token cache cleared');
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<NotificationSubscriptionResult> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return {
        success: false,
        error: 'Notifications are not supported in your browser. Please try a modern browser.'
      };
    }

    // Check if permission is already granted
    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
      // Permission already granted, get cached token
    } else if (currentPermission === 'denied') {
      return {
        success: false,
        error: 'Notification permission was previously denied. Please enable notifications in your browser settings.'
      };
    } else {
      // Request permission (only if not already granted)
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        return {
          success: false,
          error: 'Notification permission denied. Please enable notifications in your browser settings.'
        };
      }
    }

    // Get cached FCM token
    const token = await getCachedFCMToken();

    if (!token) {
      return {
        success: false,
        error: 'Failed to get notification token. Please ensure you have a stable internet connection and try again.'
      };
    }

    return {
      success: true,
      token
    };

  } catch (error) {
    console.error('Error requesting notification permission:', error);
    
    // Handle specific push service errors
    if (error instanceof Error) {
      if (error.message.includes('push service error')) {
        return {
          success: false,
          error: 'Push service registration failed. This might be due to browser restrictions or network issues. Please try refreshing the page and enabling notifications again.'
        };
      }
      
      if (error.message.includes('AbortError')) {
        return {
          success: false,
          error: 'Notification registration was aborted. Please try again or check if your browser allows notifications for this site.'
        };
      }
      
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: 'Notification setup timed out. Please check your internet connection and try again.'
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to enable notifications. Please check your browser settings and ensure you have a stable internet connection.'
    };
  }
}

/**
 * Batch subscribe/unsubscribe to order notifications (optimized for quota)
 * This replaces multiple individual calls with a single batch operation
 */
export async function updateOrderSubscription(
  subscribeOrderId: string | null,
  unsubscribeOrderId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getCachedFCMToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No notification token available.'
      };
    }

    // Call backend Cloud Function for batch operation
    const updateSubscription = httpsCallable(functions, 'updateOrderSubscription');
    
    const result = await updateSubscription({
      subscribeOrderId,
      unsubscribeOrderId,
      fcmToken: token
    });

    const data = result.data as { success: boolean; message?: string };

    if (data.success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to update subscription.'
      };
    }

  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      error: 'Failed to update notification subscription.'
    };
  }
}

/**
 * Subscribe to order notifications via backend Cloud Function
 */
export async function subscribeToOrderNotifications(
  orderId: string
): Promise<NotificationSubscriptionResult> {
  try {
    console.log(`🔔 [SUBSCRIBE] Starting subscription for order: ${orderId}`);
    
    // Step 1: Request permission and get token (uses cached token)
    const permissionResult = await requestNotificationPermission();
    
    if (!permissionResult.success || !permissionResult.token) {
      console.error(`🔔 [SUBSCRIBE] Permission failed:`, permissionResult.error);
      return permissionResult;
    }

    console.log(`🔔 [SUBSCRIBE] Permission granted, token obtained`);

    // Step 2: Call backend Cloud Function
    const subscribeToNotifications = httpsCallable(functions, 'subscribeToNotifications');
    
    console.log(`🔔 [SUBSCRIBE] Calling Cloud Function for order ${orderId}`);
    const result = await subscribeToNotifications({
      orderId,
      fcmToken: permissionResult.token
    });

    const data = result.data as { success: boolean; message?: string };

    if (data.success) {
      console.log(`🔔 [SUBSCRIBE] Successfully subscribed to order ${orderId}`);
      return {
        success: true,
        token: permissionResult.token
      };
    } else {
      console.error(`🔔 [SUBSCRIBE] Failed to subscribe to order ${orderId}:`, data.message);
      return {
        success: false,
        error: data.message || 'Failed to subscribe to notifications.'
      };
    }

  } catch (error) {
    console.error(`🔔 [SUBSCRIBE] Error subscribing to order ${orderId}:`, error);
    
    // Handle AbortError specifically - this happens when requests are cancelled
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`🔔 [SUBSCRIBE] Request was aborted for order ${orderId}`);
      return {
        success: false,
        error: 'Request was aborted. Please try again.'
      };
    }
    
    // Handle specific Firebase Functions errors
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code) {
      switch (firebaseError.code) {
        case 'unauthenticated':
          return {
            success: false,
            error: 'Please sign in to enable notifications.'
          };
        case 'not-found':
          return {
            success: false,
            error: 'Order not found.'
          };
        case 'failed-precondition':
          return {
            success: false,
            error: 'Order is already ready!'
          };
        case 'permission-denied':
          return {
            success: false,
            error: 'Permission denied. Please try again.'
          };
        default:
          return {
            success: false,
            error: 'Failed to subscribe to notifications. Please try again.'
          };
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Unsubscribe from order notifications via backend Cloud Function
 */
export async function unsubscribeFromOrderNotifications(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔔 [UNSUBSCRIBE] Starting unsubscription for order: ${orderId}`);
    
    // Get cached FCM token (no need to request permission for unsubscribe)
    const token = await getCachedFCMToken();

    if (!token) {
      console.error(`🔔 [UNSUBSCRIBE] No FCM token available for order ${orderId}`);
      // Try to get a fresh token as fallback
      const freshToken = await getCachedFCMToken(true);
      if (!freshToken) {
        console.error(`🔔 [UNSUBSCRIBE] Failed to get fresh token for order ${orderId}`);
        return {
          success: false,
          error: 'No notification token found.'
        };
      }
      console.log(`🔔 [UNSUBSCRIBE] Got fresh token for order ${orderId}`);
    }

    // Call backend Cloud Function to unsubscribe
    console.log(`🔔 [UNSUBSCRIBE] Calling Cloud Function for order ${orderId}`);
    const unsubscribeFromNotifications = httpsCallable(functions, 'unsubscribeFromNotifications');
    
    const result = await unsubscribeFromNotifications({
      orderId,
      fcmToken: token
    });

    const data = result.data as { success: boolean; message?: string };

    if (data.success) {
      console.log(`🔔 [UNSUBSCRIBE] Successfully unsubscribed from order ${orderId}`);
      return {
        success: true
      };
    } else {
      console.error(`🔔 [UNSUBSCRIBE] Failed to unsubscribe from order ${orderId}:`, data.message);
      return {
        success: false,
        error: data.message || 'Failed to unsubscribe from notifications.'
      };
    }

  } catch (error) {
    console.error(`🔔 [UNSUBSCRIBE] Error unsubscribing from order ${orderId}:`, error);
    
    // Handle AbortError specifically - this happens when requests are cancelled
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`🔔 [UNSUBSCRIBE] Request was aborted for order ${orderId}, treating as success`);
      return {
        success: true,
        error: 'Request aborted but continuing with new subscription.'
      };
    }
    
    // Try to continue even if unsubscribe fails
    return {
      success: true,
      error: 'Unsubscribe error, but continuing with new subscription.'
    };
  }
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check current permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'default'; // Return 'default' instead of 'denied' to allow modal to show
  }
  return Notification.permission;
}

/**
 * Check if the user is on an iOS device
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if the app is running in PWA/standalone mode
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as { standalone?: boolean }).standalone === true;
}

/**
 * Check if the user is on iOS Safari (non-PWA)
 */
export function isIOSSafari(): boolean {
  return isIOS() && !isPWA();
}
