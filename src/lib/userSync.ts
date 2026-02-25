/**
 * userSync — Firestore helpers for the /users/{userId} collection.
 *
 * This is the primary cross-app sync channel replacing bridge_sync.
 * Document shape:
 *   { currentCartId: string, fcmToken?: string, lastActive: Timestamp }
 *
 * The userId is a persistent UUID stored in localStorage and injected
 * into the URL (?user=) so it survives PWA installation.
 */
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserDoc {
  currentCartId: string;
  fcmToken?: string;
  selectedOrderId?: string;
  trackedOrderIds?: string[];
  lastActive: { toMillis: () => number } | null;
}

/**
 * Write (or merge-update) the user document with a new currentCartId.
 * Called by Safari (QRHandler) after scanning a QR code.
 */
export async function writeUserDoc(
  userId: string,
  cartId: string,
): Promise<void> {
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      currentCartId: cartId,
      lastActive: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * One-time read of the user document.
 * Returns the currentCartId or null if missing/not found.
 */
export async function readUserDoc(userId: string): Promise<string | null> {
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.log('👤 [USER_SYNC] No user doc found');
      return null;
    }
    const data = snap.data() as UserDoc;
    return data.currentCartId ?? null;
  } catch (error) {
    console.error('👤 [USER_SYNC] Read failed:', error);
    return null;
  }
}

/**
 * Write the FCM token into the user document.
 * Called by the PWA after push permission is granted.
 */
export async function writeUserFcmToken(
  userId: string,
  fcmToken: string,
): Promise<void> {
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      fcmToken,
      lastActive: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Remove userId from order's selectedUserIds array.
 * Called when user deselects an order or selects a different one.
 */
export async function removeUserFromOrder(
  userId: string,
  orderId: string,
): Promise<void> {
  
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    selectedUserIds: arrayRemove(userId),
  });
  }

/**
 * Handle order selection transition: remove userId from previous order and add to new order.
 * Called when user selects a new order or clears selection.
 */
export async function writeSelectedOrderWithTransition(
  userId: string,
  newOrderId: string,
  previousOrderId: string | null,
): Promise<void> {
  console.log('👤 [USER_SYNC] Handling order transition:', userId, 'from:', previousOrderId, 'to:', newOrderId);
  
  // Remove userId from previous order if it exists and is different from new order
  if (previousOrderId && previousOrderId !== newOrderId) {
    try {
      await removeUserFromOrder(userId, previousOrderId);
    } catch (error) {
      console.error('👤 [USER_SYNC] Failed to remove userId from previous order:', error);
      // Continue with new order selection even if removal fails
    }
  }
  
  // Update user document with selected order
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      selectedOrderId: newOrderId,
      lastActive: serverTimestamp(),
    },
    { merge: true },
  );
  
  // Add userId to the new order's selectedUserIds array (only if newOrderId is not empty)
  if (newOrderId) {
    const orderRef = doc(db, 'orders', newOrderId);
    await updateDoc(orderRef, {
      selectedUserIds: arrayUnion(userId),
    });
    console.log('👤 [USER_SYNC] Added userId to new order selectedUserIds:', newOrderId);
  }
  
  console.log('👤 [USER_SYNC] Order transition completed');
}

/**
 * Write the selected order ID to the user document.
 * Called when user pins/selects an order for notifications.
 * Also adds userId to the order document for proper tracking.
 */
export async function writeSelectedOrder(
  userId: string,
  orderId: string,
): Promise<void> {
  
  // Update user document with selected order
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      selectedOrderId: orderId,
      lastActive: serverTimestamp(),
    },
    { merge: true },
  );
  
  // Also add userId to the order's selectedUserIds array (only if orderId is not empty)
  if (orderId) {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      selectedUserIds: arrayUnion(userId),
    });
      }
  
}

/**
 * One-time read of the selected order ID.
 * Returns the selectedOrderId or null if missing/not found.
 */
export async function readSelectedOrder(userId: string): Promise<string | null> {
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data() as UserDoc;
    const selectedOrderId = data.selectedOrderId ?? null;
    return selectedOrderId;
  } catch (error) {
    return null;
  }
}

/**
 * Add an order to the user's tracked orders list.
 */
export async function addTrackedOrder(
  userId: string,
  orderId: string,
): Promise<void> {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    trackedOrderIds: arrayUnion(orderId),
    lastActive: serverTimestamp(),
  });
}

/**
 * Remove an order from the user's tracked orders list.
 */
export async function removeTrackedOrder(
  userId: string,
  orderId: string,
): Promise<void> {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    trackedOrderIds: arrayRemove(orderId),
    lastActive: serverTimestamp(),
  });
}

/**
 * Subscribe to real-time changes on /users/{userId}.
 * Calls onCartChanged whenever currentCartId changes.
 * Calls onOrderChanged whenever selectedOrderId changes.
 * Calls onTrackedOrdersChanged whenever trackedOrderIds changes.
 * Returns the unsubscribe function.
 */
export function subscribeUserDoc(
  userId: string,
  onCartChanged: (cartId: string) => void,
  onOrderChanged?: (orderId: string | null) => void,
  onTrackedOrdersChanged?: (orderIds: string[]) => void,
): Unsubscribe {
  const ref = doc(db, 'users', userId);
  let lastKnownCartId: string | null = null;
  let lastKnownOrderId: string | null = null;
  let lastKnownTrackedOrderIds: string[] = [];

  return onSnapshot(
    ref,
    (snap) => {
      // Only process confirmed data from server, not pending writes
      if (snap.metadata.hasPendingWrites) {
        return;
      }

      if (!snap.exists()) {
        return;
      }
      const data = snap.data() as UserDoc;
      const cartId = data.currentCartId ?? null;
      const orderId = data.selectedOrderId ?? null;
      const trackedOrderIds = data.trackedOrderIds ?? [];

      if (cartId && cartId !== lastKnownCartId) {
        lastKnownCartId = cartId;
        onCartChanged(cartId);
      }

      if (onOrderChanged && orderId !== lastKnownOrderId) {
        lastKnownOrderId = orderId;
        onOrderChanged(orderId);
      }

      if (onTrackedOrdersChanged && JSON.stringify(trackedOrderIds) !== JSON.stringify(lastKnownTrackedOrderIds)) {
        lastKnownTrackedOrderIds = trackedOrderIds;
        onTrackedOrdersChanged(trackedOrderIds);
      }
    },
    (error) => {
      console.error('👤 [USER_SYNC] Snapshot error:', error);
    },
  );
}
