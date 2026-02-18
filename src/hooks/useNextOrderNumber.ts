import { useQuery } from '@tanstack/react-query';
import { getLastCreatedOrderNumber } from '../types/orderUtils';
import { useAuthStore } from '../stores/authStore';

export function useNextOrderNumber() {
  const { cartId } = useAuthStore();

  return useQuery({
    queryKey: ['nextOrderNumber', cartId],
    queryFn: async () => {
      if (!cartId) throw new Error('No cart ID');
      const lastCreatedOrderNumber = await getLastCreatedOrderNumber(cartId);
      return lastCreatedOrderNumber + 1;
    },
    enabled: !!cartId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}
