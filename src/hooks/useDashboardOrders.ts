import { useOrderStore } from '../stores/orderStore';

export function useDashboardOrders() {
  // Consume orders directly from centralized store
  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);

  return { data: orders, isLoading };
}
