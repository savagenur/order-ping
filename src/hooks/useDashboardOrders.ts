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
    customerName: data.customerName as string,
    phoneNumber: data.phoneNumber as string,
    orderDetails: data.orderDetails as string | undefined,
    color: data.color as string | undefined,
    status: data.status as Order['status'],
    cartId: data.cartId as string,
    cartName: data.cartName as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate(),
    readyAt: (data.readyAt as { toDate: () => Date })?.toDate(),
    completedAt: (data.completedAt as { toDate: () => Date })?.toDate(),
    completedBy: data.completedBy as string | undefined,
  };
}

export function useDashboardOrders(cartId: string | null) {
  const queryClient = useQueryClient();

  // Set up realtime listener that pushes into the query cache
  useEffect(() => {
    if (!cartId) return;

    const q = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      where('status', 'in', ['preparing', 'ready']),
      orderBy('createdAt', 'asc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: Order[] = snapshot.docs.map((doc) => mapDoc(doc));
      queryClient.setQueryData(['dashboard-orders', cartId], orders);
    });

    return () => unsubscribe();
  }, [cartId, queryClient]);

  return useQuery<Order[]>({
    queryKey: ['dashboard-orders', cartId],
    // The data comes from the onSnapshot listener above, not from this fn
    queryFn: () => Promise.resolve([]),
    enabled: !!cartId,
    staleTime: Infinity, // Realtime listener keeps it fresh
  });
}
