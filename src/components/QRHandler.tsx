import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ACTIVE_CART_KEY, USER_ID_KEY } from '../lib/pwaUtils';
import { writeUserDoc } from '../lib/userSync';

/**
 * QRHandler — intercepts any route carrying ?cart=<id> (and optionally ?user=<id>).
 *
 * Safari entry point:
 *   1. Extracts cartId and userId from the URL.
 *   2. If userId is missing, generates a new UUID.
 *   3. Persists both to localStorage.
 *   4. Writes { currentCartId, lastActive } to /users/{userId} in Firestore
 *      so the installed PWA picks it up instantly via its onSnapshot listener.
 *   5. Cleans the URL to /queue?user=<userId> — cartId is removed from the
 *      address bar but lives in the cloud and localStorage.
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

    // Resolve userId: URL param → localStorage → new UUID
    const urlUserId = searchParams.get('user');
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    const userId = urlUserId || storedUserId || crypto.randomUUID();
    console.log('🔍 QRHandler: userId =', userId);

    // Persist userId and cartId to localStorage
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(ACTIVE_CART_KEY, incomingCart);
    console.log('🔍 QRHandler: Saved cartId =', incomingCart, 'userId =', userId);

    // Fire-and-forget: write to /users/{userId} so PWA onSnapshot fires instantly
    writeUserDoc(userId, incomingCart).catch((error) => {
      console.warn('🔍 QRHandler: userSync write failed (non-blocking):', error);
    });

    // Clean URL: keep only ?user= (cartId lives in cloud + localStorage)
    console.log('🔍 QRHandler: Navigating to /queue?user=', userId);
    navigate(`/queue?user=${encodeURIComponent(userId)}`, { replace: true });

    // Trigger immediate data refresh
    setTimeout(() => {
      window.dispatchEvent(new Event('focus'));
    }, 0);
  }, [searchParams, navigate]);

  return null;
}
