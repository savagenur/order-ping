import { useMemo } from 'react';
import { useOrderStore } from '../stores/orderStore';
import type { Order } from '../types/order';


interface QueueOrdersResult {
  pendingOrders: Order[];
  readyOrders: Order[];
  cartName: string;
}

export function useQueueOrders() {
  // Consume orders from centralized store
  const orders = useOrderStore((state) => state.orders);
  const cartName = useOrderStore((state) => state.cartName);
  const isLoading = useOrderStore((state) => state.isLoading);

  // Compute derived data from store
  const data = useMemo<QueueOrdersResult>(() => {
    const pendingOrders = orders.filter((o) => o.status === 'pending');

    const readyOrders = orders
      .filter((o) => o.status === 'ready')
      .sort((a, b) => {
        const aTime = a.readyAt instanceof Date ? a.readyAt.getTime() : 0;
        const bTime = b.readyAt instanceof Date ? b.readyAt.getTime() : 0;
        return bTime - aTime;
      });

    return {
      pendingOrders,
      readyOrders,
      cartName,
    };
  }, [orders, cartName]);

  return { data, isLoading };
}
