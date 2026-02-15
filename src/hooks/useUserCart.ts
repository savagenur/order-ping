import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface UserCart {
  cartId: string | null;
  cartName: string | null;
  loading: boolean;
}

export function useUserCart(): UserCart {
  const [cartInfo, setCartInfo] = useState<UserCart>({
    cartId: null,
    cartName: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get custom claims from the user's token
        const idTokenResult = await user.getIdTokenResult();
        const cartId = idTokenResult.claims.cartId as string | undefined;
        const cartName = idTokenResult.claims.cartName as string | undefined;

        setCartInfo({
          cartId: cartId || null,
          cartName: cartName || null,
          loading: false,
        });
      } else {
        setCartInfo({
          cartId: null,
          cartName: null,
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return cartInfo;
}