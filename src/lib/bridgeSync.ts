/**
 * bridgeSync — Firestore helpers for the Safari ↔ PWA synchronization bridge.
 *
 * Collection: bridge_sync/{fingerprint}
 * Document shape: { cartId: string, createdAt: Timestamp }
 *
 * TTL: 30 minutes, enforced both here (read-side guard) and in Firestore Rules.
 */
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export const BRIDGE_SYNC_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface BridgeSyncDoc {
  cartId: string;
  createdAt: { toMillis: () => number } | null;
}

/**
 * Writes (or overwrites) a bridge_sync document for the given fingerprint.
 * Called by Safari (browser) after intercepting a ?cart= QR scan.
 */
export async function writeBridgeSync(
  fingerprint: string,
  cartId: string,
): Promise<void> {
  console.log('🔍 BridgeSync: Writing bridge_sync doc');
  console.log('🔍 BridgeSync: fingerprint =', fingerprint);
  console.log('🔍 BridgeSync: cartId =', cartId);
  
  const ref = doc(db, 'bridge_sync', fingerprint);
  await setDoc(ref, {
    cartId,
    createdAt: serverTimestamp(),
  });
  
  console.log('🔍 BridgeSync: Write completed successfully');
}

/**
 * Reads the bridge_sync document for the given fingerprint.
 * Returns the cartId only if the document exists AND is within the 30-min TTL.
 * Returns null if the document is missing, expired, or malformed.
 */
export async function readBridgeSync(
  fingerprint: string,
): Promise<string | null> {
  console.log('🔍 BridgeSync: Reading bridge_sync doc');
  console.log('🔍 BridgeSync: fingerprint =', fingerprint);
  
  try {
    const ref = doc(db, 'bridge_sync', fingerprint);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log('🔍 BridgeSync: Document does not exist');
      return null;
    }

    const data = snap.data() as BridgeSyncDoc;
    console.log('🔍 BridgeSync: Document data =', data);
    
    if (!data.createdAt) {
      console.log('🔍 BridgeSync: Document missing createdAt');
      return null;
    }

    const ageMs = Date.now() - data.createdAt.toMillis();
    console.log('🔍 BridgeSync: Document age =', ageMs, 'ms (TTL =', BRIDGE_SYNC_TTL_MS, 'ms)');
    
    if (ageMs > BRIDGE_SYNC_TTL_MS) {
      console.log('🔍 BridgeSync: Document expired');
      return null;
    }

    const cartId = data.cartId ?? null;
    console.log('🔍 BridgeSync: Returning cartId =', cartId);
    return cartId;
  } catch (error) {
    console.error('🔍 BridgeSync: Read failed:', error);
    return null;
  }
}
