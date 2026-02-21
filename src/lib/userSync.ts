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
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserDoc {
  currentCartId: string;
  fcmToken?: string;
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
  console.log('👤 [USER_SYNC] Writing user doc:', userId, 'cartId:', cartId);
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      currentCartId: cartId,
      lastActive: serverTimestamp(),
    },
    { merge: true },
  );
  console.log('👤 [USER_SYNC] Write completed');
}

/**
 * One-time read of the user document.
 * Returns the currentCartId or null if missing/not found.
 */
export async function readUserDoc(userId: string): Promise<string | null> {
  console.log('👤 [USER_SYNC] Reading user doc:', userId);
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.log('👤 [USER_SYNC] No user doc found');
      return null;
    }
    const data = snap.data() as UserDoc;
    console.log('👤 [USER_SYNC] Got currentCartId:', data.currentCartId);
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
  console.log('👤 [USER_SYNC] Writing FCM token for userId:', userId);
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      fcmToken,
      lastActive: serverTimestamp(),
    },
    { merge: true },
  );
  console.log('👤 [USER_SYNC] FCM token written');
}

/**
 * Subscribe to real-time changes on /users/{userId}.
 * Calls onCartChanged whenever currentCartId changes.
 * Returns the unsubscribe function.
 */
export function subscribeUserDoc(
  userId: string,
  onCartChanged: (cartId: string) => void,
): Unsubscribe {
  console.log('👤 [USER_SYNC] Subscribing to user doc:', userId);
  const ref = doc(db, 'users', userId);
  let lastKnownCartId: string | null = null;

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        console.log('👤 [USER_SYNC] User doc does not exist yet');
        return;
      }
      const data = snap.data() as UserDoc;
      const cartId = data.currentCartId ?? null;
      console.log('👤 [USER_SYNC] Snapshot received, currentCartId:', cartId);

      if (cartId && cartId !== lastKnownCartId) {
        lastKnownCartId = cartId;
        onCartChanged(cartId);
      }
    },
    (error) => {
      console.error('👤 [USER_SYNC] Snapshot error:', error);
    },
  );
}
