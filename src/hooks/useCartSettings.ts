import { useQuery } from '@tanstack/react-query';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Cart } from '../types/admin';

async function fetchCartSettings(cartId: string): Promise<Cart['settings']> {
  const cartsQuery = query(
    collection(db, 'carts'),
    where('cartId', '==', cartId)
  );
  
  const cartsSnapshot = await getDocs(cartsQuery);
  
  if (cartsSnapshot.empty) {
    return {};
  }
  
  const cartDoc = cartsSnapshot.docs[0];
  const data = cartDoc.data();
  
  return data.settings || {};
}

export function useCartSettings(cartId: string | null) {
  return useQuery({
    queryKey: ['cart-settings', cartId],
    queryFn: () => fetchCartSettings(cartId!),
    enabled: !!cartId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
