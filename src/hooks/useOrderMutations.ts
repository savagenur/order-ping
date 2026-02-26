import { useMutation } from '@tanstack/react-query';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { getNextOrderNumber } from '../types/orderUtils';
import { incrementOrderCounter } from './useOrderCounter';
import type { Order, OrderInput } from '../types/order';

export function useAddOrder() {
  return useMutation({
    mutationFn: async (input: {
      formData: OrderInput;
      cartId: string;
      cartName: string;
    }) => {
      const orderNumber = await getNextOrderNumber(input.cartId);

      await addDoc(collection(db, 'orders'), {
        orderNumber,
        customerName: input.formData.customerName,
        phoneNumber: input.formData.phoneNumber,
        orderDetails: input.formData.orderDetails || '',
        status: 'pending',
        source: 'manual',
        cartId: input.cartId,
        cartName: input.cartName,
        // Don't set userId initially - only add when customer selects/pins the order
        createdAt: Timestamp.now(),
      });
    },
  });
}

export function useAddNumpadOrder() {
  return useMutation({
    mutationFn: async (input: {
      orderNumber: number;
      color: string;
      cartId: string;
      cartName: string;
    }) => {
      // Create order and increment counter in parallel
      const [orderDoc] = await Promise.all([
        addDoc(collection(db, 'orders'), {
          orderNumber: input.orderNumber,
          customerName: '',
          phoneNumber: '',
          orderDetails: '',
          color: input.color,
          status: 'pending',
          source: 'manual',
          cartId: input.cartId,
          cartName: input.cartName,
          // Don't set userId initially - only add when customer selects/pins the order
          createdAt: Timestamp.now(),
        }),
        // Increment the counter for next numeric order
        incrementOrderCounter(input.cartId),
      ]);

      return orderDoc.id;
    },
  });
}

export function useMarkReady() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'ready',
        readyAt: Timestamp.now(),
      });
    },
  });
}

export function useMarkAllReady() {
  return useMutation({
    mutationFn: async (pendingOrders: Order[]) => {
      if (pendingOrders.length === 0) return;

      const batch = writeBatch(db);
      const now = Timestamp.now();

      pendingOrders.forEach((order) => {
        const orderRef = doc(db, 'orders', order.id);
        batch.update(orderRef, {
          status: 'ready',
          readyAt: now,
        });
      });

      await batch.commit();
    },
  });
}

export function useRetryDeclinedOrder() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const orderRef = doc(db, 'orders', orderId);
      
      try {
        // Fetch the order document to verify it exists
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error('Order not found - may have been deleted');
        }
        
        const orderData = orderDoc.data();
        
        // Check if order is still declined
        if (orderData.status === 'declined') {
          return {
            id: orderDoc.id,
            orderNumber: orderData.orderNumber,
            status: orderData.status,
            expireAt: orderData.expireAt,
            message: 'Order is still declined - deletion may be in progress'
          };
        } else if (orderData.status === 'expired') {
          return {
            id: orderDoc.id,
            orderNumber: orderData.orderNumber,
            status: orderData.status,
            message: 'Order has expired and been removed'
          };
        } else {
          return {
            id: orderDoc.id,
            orderNumber: orderData.orderNumber,
            status: orderData.status,
            message: `Order status changed to: ${orderData.status}`
          };
        }
      } catch (error) {
        // Check for network errors
        if (error instanceof Error && (
          error.message.includes('network') ||
          error.message.includes('connection') ||
          error.message.includes('offline') ||
          error.message.includes('UNAVAILABLE') ||
          error.message.includes('timeout')
        )) {
          throw new Error('No internet connection - please check your network and try again');
        }
        
        // Re-throw other errors
        throw error;
      }
    },
  });
}

export function useMarkCompleted() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        completedBy: auth.currentUser?.uid || '',
      });
    },
  });
}
