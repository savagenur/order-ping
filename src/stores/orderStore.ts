import { create } from 'zustand';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';

interface OrderState {
  orders: Order[];
  cartName: string;
  isLoading: boolean;
  isSubscribed: boolean;
  currentCartId: string | null;
  unsubscribe: Unsubscribe | null;
  
  // Actions
  subscribeToOrders: (cartId: string) => void;
  unsubscribeFromOrders: () => void;
  setOrders: (orders: Order[], cartName: string) => void;
  setLoading: (loading: boolean) => void;
}

function mapDoc(doc: { id: string; data: () => Record<string, unknown> }): Order {
  const data = doc.data();
  return {
    id: doc.id,
    orderNumber: (data.orderNumber as number) || 0,
    customerName: (data.customerName as string) || '',
    phoneNumber: (data.phoneNumber as string) || '',
    orderDetails: data.orderDetails as string | undefined,
    color: data.color as string | undefined,
    status: (data.status as Order['status']) || 'pending',
    cartId: (data.cartId as string) || '',
    cartName: (data.cartName as string) || '',
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    readyAt: (data.readyAt as { toDate: () => Date })?.toDate(),
    completedAt: (data.completedAt as { toDate: () => Date })?.toDate(),
    completedBy: data.completedBy as string | undefined,
  };
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  cartName: '',
  isLoading: false,
  isSubscribed: false,
  currentCartId: null,
  unsubscribe: null,

  subscribeToOrders: (cartId: string) => {
    const state = get();
    
    // Singleton pattern: If already subscribed to the same cart, do nothing
    if (state.isSubscribed && state.currentCartId === cartId) {
      console.log('📦 [ORDER_STORE] Already subscribed to cart:', cartId);
      return;
    }

    // If subscribed to a different cart, unsubscribe first
    if (state.isSubscribed && state.currentCartId !== cartId) {
      console.log('📦 [ORDER_STORE] Switching carts, unsubscribing from:', state.currentCartId);
      state.unsubscribeFromOrders();
    }

    console.log('📦 [ORDER_STORE] Subscribing to cart:', cartId);
    set({ isLoading: true, currentCartId: cartId });

    // Filter orders from last 24 hours only
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      where('status', 'in', ['preparing', 'ready']),
      where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    let lastOrderIds: string[] = [];

    const unsubscribeFn = onSnapshot(
      ordersQuery,
      (snapshot) => {
        // Only process confirmed data from server, not pending writes
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        const allOrders: Order[] = snapshot.docs.map((doc) => mapDoc(doc));
        const cartName = allOrders.length > 0 ? allOrders[0].cartName : '';

        // Shallow comparison to prevent redundant state updates
        const currentOrderIds = allOrders.map(o => o.id);
        const hasChanged = 
          lastOrderIds.length !== currentOrderIds.length ||
          JSON.stringify(lastOrderIds) !== JSON.stringify(currentOrderIds);

        if (hasChanged) {
          lastOrderIds = currentOrderIds;
          console.log('📦 [ORDER_STORE] Orders updated, count:', allOrders.length);
          set({ 
            orders: allOrders, 
            cartName, 
            isLoading: false 
          });
        } else if (get().isLoading) {
          // First load complete, even if no changes
          set({ isLoading: false });
        }
      },
      (error) => {
        console.error('📦 [ORDER_STORE] Subscription error:', error);
        set({ isLoading: false });
      }
    );

    set({ 
      unsubscribe: unsubscribeFn, 
      isSubscribed: true 
    });
  },

  unsubscribeFromOrders: () => {
    const state = get();
    
    if (state.unsubscribe) {
      console.log('📦 [ORDER_STORE] Unsubscribing from cart:', state.currentCartId);
      state.unsubscribe();
      set({ 
        unsubscribe: null, 
        isSubscribed: false, 
        currentCartId: null,
        orders: [],
        cartName: '',
        isLoading: false
      });
    }
  },

  setOrders: (orders: Order[], cartName: string) => {
    set({ orders, cartName });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
