import { useMutation } from '@tanstack/react-query';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  writeBatch,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { getNextOrderNumber } from '../types/orderUtils';
import type { Order, OrderInput } from '../types/order';

async function getCustomerUserIdForCart(cartId: string): Promise<string | null> {
  try {
    const q = query(
      collection(db, 'users'),
      where('currentCartId', '==', cartId),
      limit(1),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const userId = snap.docs[0].id;
      console.log(`[ORDER] Found customer userId for cart ${cartId}:`, userId);
      return userId;
    }
    console.log(`[ORDER] No customer found for cart ${cartId}`);
    return null;
  } catch (err) {
    console.error('[ORDER] Failed to lookup customer userId:', err);
    return null;
  }
}

export function useAddOrder() {
  return useMutation({
    mutationFn: async (input: {
      formData: OrderInput;
      cartId: string;
      cartName: string;
    }) => {
      const orderNumber = await getNextOrderNumber(input.cartId);
      const customerUserId = await getCustomerUserIdForCart(input.cartId);

      await addDoc(collection(db, 'orders'), {
        orderNumber,
        customerName: input.formData.customerName,
        phoneNumber: input.formData.phoneNumber,
        orderDetails: input.formData.orderDetails || '',
        status: 'pending',
        cartId: input.cartId,
        cartName: input.cartName,
        userId: customerUserId, // Customer's userId for PWA notification lookup
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
      const customerUserId = await getCustomerUserIdForCart(input.cartId);

      await addDoc(collection(db, 'orders'), {
        orderNumber: input.orderNumber,
        customerName: '',
        phoneNumber: '',
        orderDetails: '',
        color: input.color,
        status: 'pending',
        cartId: input.cartId,
        cartName: input.cartName,
        userId: customerUserId, // Customer's userId for PWA notification lookup
        createdAt: Timestamp.now(),
      });
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
