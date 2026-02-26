import { useMutation } from '@tanstack/react-query';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
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
