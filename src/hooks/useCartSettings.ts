import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Cart } from '../types/admin';

export function useCartSettings(cartId: string | null) {
  const queryClient = useQueryClient();
  const lastDataRef = useRef<Cart['settings'] | null>(null);

  useEffect(() => {
    if (!cartId) return;

    const cartsQuery = query(
      collection(db, 'carts'),
      where('cartId', '==', cartId)
    );

    const unsubscribe = onSnapshot(
      cartsQuery,
      (snapshot) => {
        // Only process confirmed data from server, not pending writes
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        let newSettings: Cart['settings'] = {};
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          newSettings = data.settings || {};
        }

        // Shallow comparison to prevent redundant state updates
        const hasChanged = !lastDataRef.current ||
          JSON.stringify(lastDataRef.current) !== JSON.stringify(newSettings);

        if (hasChanged) {
          lastDataRef.current = newSettings;
          queryClient.setQueryData<Cart['settings']>(['cart-settings', cartId], newSettings);
        }
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
