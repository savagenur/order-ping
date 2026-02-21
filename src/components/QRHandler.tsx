import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ACTIVE_CART_KEY } from '../lib/pwaUtils';

/**
 * QRHandler — mounts inside the Router, intercepts any route that carries a
 * ?cart=<id> query parameter, persists the value to localStorage, then
 * redirects to the clean /queue URL so the parameter never stays visible.
 *
 * Also handles the "restaurant switch" edge case: if the incoming cart ID
 * differs from the one already stored, it overwrites localStorage so the
 * Queue page immediately re-subscribes to the new cart's Firestore feed.
 */
export default function QRHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const incomingCart = searchParams.get('cart');
    if (!incomingCart) return;

    const stored = localStorage.getItem(ACTIVE_CART_KEY);

    if (stored !== incomingCart) {
      localStorage.setItem(ACTIVE_CART_KEY, incomingCart);
    }

    navigate('/queue', { replace: true });
  }, [searchParams, navigate]);

  return null;
}
