import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ACTIVE_CART_KEY, isStandalone } from '../lib/pwaUtils';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { writeBridgeSync } from '../lib/bridgeSync';

/**
 * QRHandler — mounts inside the Router, intercepts any route that carries a
 * ?cart=<id> query parameter, persists the value to localStorage, then
 * redirects to the clean /queue URL so the parameter never stays visible.
 *
 * Also handles the "restaurant switch" edge case: if the incoming cart ID
 * differs from the one already stored, it overwrites localStorage so the
 * Queue page immediately re-subscribes to the new cart's Firestore feed.
 *
 * Safari Broadcaster: when running in browser mode (not standalone PWA),
 * additionally writes a bridge_sync/{fingerprint} document to Firestore so
 * the installed PWA can pick up the new cartId on its next focus event.
 */
export default function QRHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const incomingCart = searchParams.get('cart');
    console.log('🔍 QRHandler: incomingCart =', incomingCart);
    if (!incomingCart) {
      console.log('🔍 QRHandler: No cart parameter, exiting');
      return;
    }

    const stored = localStorage.getItem(ACTIVE_CART_KEY);
    console.log('🔍 QRHandler: stored cartId =', stored);
    console.log('🔍 QRHandler: isStandalone =', isStandalone());
    
    if (stored !== incomingCart) {
      console.log('🔍 QRHandler: Updating localStorage from', stored, 'to', incomingCart);
      localStorage.setItem(ACTIVE_CART_KEY, incomingCart);
    } else {
      console.log('🔍 QRHandler: localStorage already has correct cartId');
    }

    // Safari Broadcaster: write to Firestore bridge so the PWA can sync.
    // Only fires in browser (non-standalone) mode — the PWA handles its own
    // cartId directly via localStorage.
    if (!isStandalone()) {
      console.log('🔍 QRHandler: Generating fingerprint for bridge sync...');
      // Fire-and-forget bridge sync - never block navigation
      getDeviceFingerprint()
        .then((fingerprint) => {
          console.log('🔍 QRHandler: Generated fingerprint =', fingerprint);
          console.log('🔍 QRHandler: Writing to bridge_sync...');
          return writeBridgeSync(fingerprint, incomingCart);
        })
        .then(() => {
          console.log('🔍 QRHandler: Bridge sync write completed');
        })
        .catch((error) => {
          console.log('🔍 QRHandler: Bridge sync failed (error resilience):', error);
          // Error resilience: bridge sync failures never block the QR flow
        });
    } else {
      console.log('🔍 QRHandler: PWA mode, skipping bridge sync');
    }

    // Navigate to clean URL
    console.log('🔍 QRHandler: Navigating to /queue...');
    navigate('/queue', { replace: true });
    
    // Trigger immediate data refresh by dispatching a focus event
    // This ensures Queue's existing listeners re-fetch fresh data
    setTimeout(() => {
      console.log('🔍 QRHandler: Dispatching focus event');
      window.dispatchEvent(new Event('focus'));
    }, 0);
  }, [searchParams, navigate]);

  return null;
}
