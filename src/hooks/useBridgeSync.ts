/**
 * useBridgeSync — PWA "Intelligent Receiver"
 *
 * On every app focus / visibility-change event:
 *   1. Generate the device fingerprint.
 *   2. Query bridge_sync/{fingerprint} in Firestore.
 *   3. Comparison engine:
 *      • Doc exists & within 30 min → compare cloudCartId with localStorage.
 *        If different: update localStorage + call onCartChanged so callers can
 *        invalidate queries and re-fetch restaurant data.
 *      • Doc missing / expired → fall back to localStorage.
 *        If localStorage is also empty → call onNoCart so the UI can show the
 *        "Scan QR" onboarding screen.
 *
 * This hook is intentionally side-effect-only (no returned state) so it can
 * be mounted once at the App level without causing re-renders.
 */
import { useEffect, useRef, useCallback } from 'react';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { readBridgeSync } from '../lib/bridgeSync';
import { ACTIVE_CART_KEY, isStandalone } from '../lib/pwaUtils';

interface UseBridgeSyncOptions {
  /** Called when the cloud cartId differs from the local one. */
  onCartChanged: (newCartId: string) => void;
  /** Called when neither cloud nor localStorage has a cartId. */
  onNoCart: () => void;
}

export function useBridgeSync({ onCartChanged, onNoCart }: UseBridgeSyncOptions) {
  const isSyncing = useRef(false);
  const lastSyncTime = useRef(0);
  const lastKnownFingerprint = useRef<string | null>(null);

  const syncContext = useCallback(async (force = false) => {
    console.log('🔍 BridgeSync: syncContext triggered, force =', force);
    console.log('🔍 BridgeSync: isStandalone =', isStandalone());
    
    // Only run in standalone (PWA) mode — Safari handles its own flow.
    if (!isStandalone()) {
      console.log('🔍 BridgeSync: Not in standalone mode, skipping');
      return;
    }
    
    // Sync cooldown: only sync if 10+ seconds have passed since last sync (unless forced)
    const now = Date.now();
    if (!force && now - lastSyncTime.current < 10000) {
      console.log('🔍 BridgeSync: Sync cooldown active, skipping');
      return;
    }
    
    // Prevent concurrent syncs.
    if (isSyncing.current) {
      console.log('🔍 BridgeSync: Already syncing, skipping');
      return;
    }
    isSyncing.current = true;
    lastSyncTime.current = now;

    try {
      console.log('🔍 BridgeSync: Generating fingerprint...');
      const fingerprint = await getDeviceFingerprint();
      
      // Background silence: if fingerprint matches last known and we have local data, skip Firestore read
      const localCartId = localStorage.getItem(ACTIVE_CART_KEY);
      const fingerprintMatches = lastKnownFingerprint.current === fingerprint;
      
      if (fingerprintMatches && localCartId) {
        console.log('🔍 BridgeSync: Fingerprint unchanged, checking if we can skip Firestore read');
        // Quick check: if we have local data and fingerprint hasn't changed, assume no sync needed
        // This is the "background silence" optimization
        console.log('🔍 BridgeSync: Background silence - skipping sync for seamless experience');
        return;
      }
      
      lastKnownFingerprint.current = fingerprint;
      console.log('🔍 BridgeSync: Reading from Firestore...');
      const cloudCartId = await readBridgeSync(fingerprint);
      
      console.log('🔍 BridgeSync: cloudCartId =', cloudCartId);
      console.log('🔍 BridgeSync: localCartId =', localCartId);

      if (cloudCartId !== null) {
        // Cloud document is valid and within TTL.
        if (cloudCartId !== localCartId) {
          console.log('🔍 BridgeSync: Cart IDs differ, updating localStorage');
          localStorage.setItem(ACTIVE_CART_KEY, cloudCartId);
          console.log('🔍 BridgeSync: Calling onCartChanged with', cloudCartId);
          onCartChanged(cloudCartId);
        } else {
          console.log('🔍 BridgeSync: Cart IDs match, background silence - no UI refresh');
        }
        // If they match, do nothing — keep UI stable.
      } else {
        console.log('🔍 BridgeSync: No valid cloud document');
        // No valid cloud document — fall back to localStorage.
        if (!localCartId) {
          console.log('🔍 BridgeSync: No local cartId either, calling onNoCart');
          onNoCart();
        } else {
          console.log('🔍 BridgeSync: Using local cartId', localCartId);
        }
        // If localStorage has a cartId, keep using it silently.
      }
    } catch (error) {
      console.error('🔍 BridgeSync: Sync error:', error);
      // Error resilience: silently fall back to localStorage without showing loading states
      console.log('🔍 BridgeSync: Error resilience - falling back to localStorage silently');
      // Don't call onNoCart here to avoid unwanted UI changes
    } finally {
      isSyncing.current = false;
      console.log('🔍 BridgeSync: Sync completed');
    }
  }, [onCartChanged, onNoCart]);

  useEffect(() => {
    // Only attach listeners in standalone (PWA) mode.
    if (!isStandalone()) return;

    const handleFocus = () => syncContext();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncContext();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Run once on mount so the PWA syncs immediately when it opens.
    syncContext();

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncContext]);
}
