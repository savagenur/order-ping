import { useQuery } from '@tanstack/react-query';
import { getLastCreatedOrderNumber } from '../types/orderUtils';
import { useAuthStore } from '../stores/authStore';

const LOCAL_NEXT_ORDER_KEY = 'nextOrderNumber';

export function useNextOrderNumber() {
  const { cartId } = useAuthStore();

  return useQuery({
    queryKey: ['nextOrderNumber', cartId],
    queryFn: async () => {
      if (!cartId) throw new Error('No cart ID');
      
      // Get local next order number
      const localNextOrder = localStorage.getItem(`${LOCAL_NEXT_ORDER_KEY}_${cartId}`);
      const localNextOrderNum = localNextOrder ? parseInt(localNextOrder, 10) : null;
      
      // Get actual last order number from server
      const lastCreatedOrderNumber = await getLastCreatedOrderNumber(cartId);
      const actualNextOrder = lastCreatedOrderNumber + 1;
      
      // If local number exists, check if it's behind server
      if (localNextOrderNum) {
        if (localNextOrderNum >= actualNextOrder) {
          return localNextOrderNum;
        } else {
          localStorage.setItem(`${LOCAL_NEXT_ORDER_KEY}_${cartId}`, actualNextOrder.toString());
          return actualNextOrder;
        }
      }
      
      // No local number, use server and set local
      localStorage.setItem(`${LOCAL_NEXT_ORDER_KEY}_${cartId}`, actualNextOrder.toString());
      return actualNextOrder;
    },
    enabled: !!cartId,
    refetchOnMount: 'always',
  });
}

// Function to update local next order number
export function updateLocalNextOrderNumber(cartId: string, orderNumber: number) {
  const nextOrder = orderNumber + 1;
  localStorage.setItem(`${LOCAL_NEXT_ORDER_KEY}_${cartId}`, nextOrder.toString());
  console.log('Updated local next order number to:', nextOrder);
}
