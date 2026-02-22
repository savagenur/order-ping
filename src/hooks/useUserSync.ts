/**
 * useUserSync — real-time listener on /users/{userId}.
 *
 * Runs in BOTH Safari and PWA contexts.
 * When the cloud document's currentCartId changes (e.g. Safari scanned a new
 * QR), this hook fires onCartChanged so the Queue page re-subscribes instantly.
 *
 * On first mount it also does a one-time read to bootstrap the cartId if
 * localStorage is empty (PWA cold-start from start_url with ?user=).
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { ACTIVE_CART_KEY } from '../lib/pwaUtils';
import { readUserDoc, subscribeUserDoc } from '../lib/userSync';

interface UseUserSyncOptions {
  userId: string | null;
  onCartChanged: (cartId: string) => void;
  onOrderChanged?: (orderId: string | null) => void;
}

export function useUserSync({ userId, onCartChanged, onOrderChanged }: UseUserSyncOptions) {
  const onCartChangedRef = useRef(onCartChanged);
  const onOrderChangedRef = useRef(onOrderChanged);
  useLayoutEffect(() => {
    onCartChangedRef.current = onCartChanged;
    onOrderChangedRef.current = onOrderChanged;
  });

  useEffect(() => {
    if (!userId) return;

    // One-time bootstrap: if localStorage has no cartId, pull from Firestore.
    const localCartId = localStorage.getItem(ACTIVE_CART_KEY);
    if (!localCartId) {
      readUserDoc(userId).then((cloudCartId) => {
        if (cloudCartId) {
          console.log('👤 [USER_SYNC] Bootstrap: setting cartId from cloud:', cloudCartId);
          localStorage.setItem(ACTIVE_CART_KEY, cloudCartId);
          onCartChangedRef.current(cloudCartId);
        }
      });
    }

    // Real-time listener: fires on every currentCartId or selectedOrderId change.
    const unsubscribe = subscribeUserDoc(
      userId,
      (cartId) => {
        const current = localStorage.getItem(ACTIVE_CART_KEY);
        if (cartId !== current) {
          console.log('👤 [USER_SYNC] Real-time: cartId changed to', cartId);
          localStorage.setItem(ACTIVE_CART_KEY, cartId);
          onCartChangedRef.current(cartId);
        }
      },
      (orderId) => {
        console.log('👤 [USER_SYNC] Real-time: selectedOrderId changed to', orderId);
        onOrderChangedRef.current?.(orderId);
      },
    );

    return () => unsubscribe();
  }, [userId]);
}
