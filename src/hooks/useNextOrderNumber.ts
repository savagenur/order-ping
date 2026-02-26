import { useQuery } from '@tanstack/react-query';
import { getCurrentOrderNumber } from './useOrderCounter';
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
      
      // Get current numeric order from counter (single document read)
      const currentNumericOrder = await getCurrentOrderNumber(cartId);
      const actualNextOrder = currentNumericOrder + 1;
      
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
}

// Function to fetch current next order number from server and save locally
export async function fetchAndSaveCurrentNextOrderNumber(cartId: string): Promise<number> {
  if (!cartId) throw new Error('No cart ID');
  
  try {
    // Get current numeric order from counter (single document read)
    const currentNumericOrder = await getCurrentOrderNumber(cartId);
    const actualNextOrder = currentNumericOrder + 1;
    
    // Save to local storage
    localStorage.setItem(`${LOCAL_NEXT_ORDER_KEY}_${cartId}`, actualNextOrder.toString());
    
    return actualNextOrder;
  } catch (error) {
    console.error('Error fetching current next order number:', error);
    throw error;
  }
}
