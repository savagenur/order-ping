import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';

function mapDoc(doc: { id: string; data: () => Record<string, unknown> }): Order {
  const data = doc.data();
  return {
    id: doc.id,
    orderNumber: (data.orderNumber as number) || 0,
    customerName: (data.customerName as string) || '',
    phoneNumber: (data.phoneNumber as string) || '',
    orderDetails: data.orderDetails as string | undefined,
    status: (data.status as Order['status']) || 'pending',
    cartId: (data.cartId as string) || '',
    cartName: (data.cartName as string) || '',
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    readyAt: (data.readyAt as { toDate: () => Date })?.toDate(),
    completedAt: (data.completedAt as { toDate: () => Date })?.toDate(),
  };
}

interface QueueOrdersResult {
  pendingOrders: Order[];
  readyOrders: Order[];
  cartName: string;
}

export function useQueueOrders(cartId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cartId) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      orderBy('createdAt', 'asc'),
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const allOrders: Order[] = snapshot.docs.map((doc) => mapDoc(doc));

        const cartName = allOrders.length > 0 ? allOrders[0].cartName : '';

        const pendingOrders = allOrders.filter((o) => o.status === 'pending');

        const readyOrders = allOrders
          .filter((o) => o.status === 'ready')
          .sort((a, b) => {
            const aTime = a.readyAt instanceof Date ? a.readyAt.getTime() : 0;
            const bTime = b.readyAt instanceof Date ? b.readyAt.getTime() : 0;
            return bTime - aTime;
          });

        queryClient.setQueryData<QueueOrdersResult>(['queue-orders', cartId], {
          pendingOrders,
          readyOrders,
          cartName,
        });
      },
      (error) => {
        console.error('Error fetching queue orders:', error);
      },
    );

    return () => unsubscribe();
  }, [cartId, queryClient]);

  return useQuery<QueueOrdersResult>({
    queryKey: ['queue-orders', cartId],
    queryFn: () => Promise.resolve({ pendingOrders: [], readyOrders: [], cartName: '' }),
    enabled: !!cartId,
    staleTime: Infinity,
  });
}
