import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Cart } from '../types/admin';

export function useCartSettings(cartId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cartId) return;

    const cartsQuery = query(
      collection(db, 'carts'),
      where('cartId', '==', cartId)
    );

    const unsubscribe = onSnapshot(
      cartsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          queryClient.setQueryData<Cart['settings']>(['cart-settings', cartId], {});
          return;
        }
        const data = snapshot.docs[0].data();
        queryClient.setQueryData<Cart['settings']>(['cart-settings', cartId], data.settings || {});
      },
      (error) => {
        console.error('Error fetching cart settings:', error);
      }
    );

    return () => unsubscribe();
  }, [cartId, queryClient]);

  return useQuery<Cart['settings']>({
    queryKey: ['cart-settings', cartId],
    queryFn: () => Promise.resolve({}),
    enabled: !!cartId,
    staleTime: Infinity,
  });
}
