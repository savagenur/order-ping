import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface NotificationSubscriptionResult {
  success: boolean;
  error?: string;
  token?: string;
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
      // Permission already granted, proceed to get token
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

    // Get FCM token using service worker with timeout
    const registration = await navigator.serviceWorker.ready;
    
    // Import getToken dynamically to avoid SSR issues
    const { getToken } = await import('firebase/messaging');
    const { getMessaging } = await import('firebase/messaging');
    
    const messaging = getMessaging();
    
    // Add timeout to prevent hanging
    const tokenPromise = getToken(messaging, {
      vapidKey: "BEe09hbvQNef0u4fgmfMN_pRuhFsGY9W9QQQyR5OYs-YcriXv7O4dR1YSWa1kGo05aZR0IbdxTDHF9gMX5bqeaI",
      serviceWorkerRegistration: registration
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Token request timeout')), 10000);
    });
    
    const token = await Promise.race([tokenPromise, timeoutPromise]);

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
 * Subscribe to order notifications via backend Cloud Function
 */
export async function subscribeToOrderNotifications(
  orderId: string
): Promise<NotificationSubscriptionResult> {
  try {
    // Step 1: Request permission and get token
    const permissionResult = await requestNotificationPermission();
    
    if (!permissionResult.success || !permissionResult.token) {
      return permissionResult;
    }

    // Step 2: Call backend Cloud Function
    const subscribeToNotifications = httpsCallable(functions, 'subscribeToNotifications');
    
    const result = await subscribeToNotifications({
      orderId,
      fcmToken: permissionResult.token
    });

    const data = result.data as { success: boolean; message?: string };

    if (data.success) {
      return {
        success: true,
        token: permissionResult.token
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to subscribe to notifications.'
      };
    }

  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    
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
         (window.navigator as any).standalone === true;
}

/**
 * Check if the user is on iOS Safari (non-PWA)
 */
export function isIOSSafari(): boolean {
  return isIOS() && !isPWA();
}
