import { create } from 'zustand';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
  deleteField,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';

// Constants
const GHOST_EFFECT_DURATION = 3000; // 3 seconds

interface OrderState {
  orders: Order[];
  cartName: string;
  isLoading: boolean;
  isSubscribed: boolean;
  currentCartId: string | null;
  unsubscribe: Unsubscribe | null;
  restoredOrderIds: Set<string>; // Track recently restored orders for ghost effect
  
  // Actions
  subscribeToOrders: (cartId: string) => void;
  unsubscribeFromOrders: () => void;
  setOrders: (orders: Order[], cartName: string) => void;
  setLoading: (loading: boolean) => void;
  undoLastOrder: () => Promise<void>;
  clearRestoredOrder: (orderId: string) => void;
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
  restoredOrderIds: new Set(),

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
      where('status', 'in', ['pending', 'ready']),
      where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    let lastOrderIds: string[] = [];

    const unsubscribeFn = onSnapshot(
      ordersQuery,
      (snapshot) => {
        // Process all snapshots including local writes for immediate UI updates

        const allOrders: Order[] = snapshot.docs.map((doc) => mapDoc(doc));
        const cartName = allOrders.length > 0 ? allOrders[0].cartName : '';

        // Enhanced comparison to detect status changes, not just ID changes
        const currentOrderIds = allOrders.map(o => o.id);
        const currentOrderStatuses = allOrders.map(o => ({ id: o.id, status: o.status }));
        const lastOrderStatuses = get().orders.map(o => ({ id: o.id, status: o.status }));
        
        const hasChanged = 
          lastOrderIds.length !== currentOrderIds.length ||
          JSON.stringify(lastOrderIds) !== JSON.stringify(currentOrderIds) ||
          JSON.stringify(lastOrderStatuses) !== JSON.stringify(currentOrderStatuses);

        if (hasChanged) {
          lastOrderIds = currentOrderIds;
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
        isLoading: false,
        restoredOrderIds: new Set(),
      });
    }
  },

  setOrders: (orders: Order[], cartName: string) => {
    set({ orders, cartName });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  undoLastOrder: async () => {
    const state = get();
    if (!state.currentCartId) {
      console.warn('No cart ID available for undo');
      return;
    }
    
    try {
      // Query for the most recently completed order
      const completedOrdersQuery = query(
        collection(db, 'orders'),
        where('cartId', '==', state.currentCartId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(completedOrdersQuery);
      
      if (querySnapshot.empty) {
        console.log('No completed orders found to undo');
        return;
      }
      
      const orderDoc = querySnapshot.docs[0];
      const orderId = orderDoc.id;
      
      // Update order back to ready status
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'ready',
        completedAt: deleteField(),
        completedBy: null,
        readyAt: Timestamp.now(),
      });
      
      // Apply ghost effect
      const newRestoredOrderIds = new Set(state.restoredOrderIds);
      newRestoredOrderIds.add(orderId);
      set({ restoredOrderIds: newRestoredOrderIds });
      
      // Remove ghost effect after delay
      setTimeout(() => {
        const currentState = get();
        const updatedRestoredOrderIds = new Set(currentState.restoredOrderIds);
        updatedRestoredOrderIds.delete(orderId);
        set({ restoredOrderIds: updatedRestoredOrderIds });
      }, GHOST_EFFECT_DURATION);
      
      console.log(`Successfully restored order ${orderId} to ready status`);
      
    } catch (error) {
      console.error('Failed to undo order:', error);
      throw error; // Re-throw to allow caller to handle
    }
  },

  clearRestoredOrder: (orderId: string) => {
    const state = get();
    const newRestoredOrderIds = new Set(state.restoredOrderIds);
    newRestoredOrderIds.delete(orderId);
    set({ restoredOrderIds: newRestoredOrderIds });
  },
}));
