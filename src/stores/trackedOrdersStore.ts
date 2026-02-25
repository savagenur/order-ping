import { create } from 'zustand';
import {
  collection,
  onSnapshot,
  query,
  where,
  documentId,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { removeTrackedOrder } from '../lib/userSync';
import { USER_ID_KEY } from '../lib/pwaUtils';
import type { Order } from '../types/order';

// Cache configuration
const CACHE_KEY = 'orderping_tracked_orders_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  orders: Order[];
  timestamp: number;
  orderIds: string[];
}

interface TrackedOrdersState {
  trackedOrderIds: string[];
  trackedOrders: Order[];
  isLoading: boolean;
  unsubscribe: Unsubscribe | null;
  lastFetchTime: number;
  
  // Actions
  setTrackedOrderIds: (orderIds: string[]) => void;
  subscribeToTrackedOrders: (orderIds: string[]) => void;
  unsubscribeFromTrackedOrders: () => void;
  loadFromCache: () => void;
  saveToCache: (orders: Order[], orderIds: string[]) => void;
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

// Helper functions for cache management
function loadCachedOrders(): CachedData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    // Deserialize dates (they're stored as ISO strings in cache)
    data.orders = data.orders.map(order => ({
      ...order,
      createdAt: new Date(order.createdAt as string | number | Date),
      readyAt: order.readyAt ? new Date(order.readyAt as string | number | Date) : undefined,
      completedAt: order.completedAt ? new Date(order.completedAt as string | number | Date) : undefined,
    }));
    
    return data;
  } catch (error) {
    console.error('📦 [TRACKED_ORDERS] Failed to load cache:', error);
    return null;
  }
}

function saveCachedOrders(orders: Order[], orderIds: string[]): void {
  try {
    const data: CachedData = {
      orders,
      orderIds,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('📦 [TRACKED_ORDERS] Failed to save cache:', error);
  }
}

export const useTrackedOrdersStore = create<TrackedOrdersState>((set, get) => ({
  trackedOrderIds: [],
  trackedOrders: [],
  isLoading: false,
  unsubscribe: null,
  lastFetchTime: 0,

  loadFromCache: () => {
    const cached = loadCachedOrders();
    if (cached) {
      set({ 
        trackedOrders: cached.orders,
        trackedOrderIds: cached.orderIds,
        lastFetchTime: cached.timestamp,
      });
    }
  },

  saveToCache: (orders: Order[], orderIds: string[]) => {
    saveCachedOrders(orders, orderIds);
  },

  setTrackedOrderIds: (orderIds: string[]) => {
    const state = get();
    
    // Only update if the array has changed
    if (JSON.stringify(state.trackedOrderIds) !== JSON.stringify(orderIds)) {
      set({ trackedOrderIds: orderIds });
      
      // Try to load from cache first for instant UI
      const cached = loadCachedOrders();
      if (cached && JSON.stringify(cached.orderIds) === JSON.stringify(orderIds)) {
        set({ 
          trackedOrders: cached.orders,
          lastFetchTime: cached.timestamp,
        });
      }
      
      // Re-subscribe with new order IDs (will update from server)
      state.subscribeToTrackedOrders(orderIds);
    }
  },

  subscribeToTrackedOrders: (orderIds: string[]) => {
    const state = get();
    
    // Unsubscribe from previous listener
    if (state.unsubscribe) {
      state.unsubscribe();
      set({ unsubscribe: null });
    }

    // Handle empty array case - Firestore throws error if 'in' array is empty
    if (orderIds.length === 0) {
      localStorage.removeItem(CACHE_KEY);
      set({ 
        trackedOrders: [], 
        isLoading: false,
        unsubscribe: null,
      });
      return;
    }

    
    // Only show loading if we don't have cached data
    const cached = loadCachedOrders();
    const hasCachedData = cached && JSON.stringify(cached.orderIds) === JSON.stringify(orderIds);
    set({ isLoading: !hasCachedData });

    // Firestore 'in' query supports up to 10 items, but we'll handle up to 30 by batching
    const batchSize = 10;
    const batches: string[][] = [];
    
    for (let i = 0; i < orderIds.length; i += batchSize) {
      batches.push(orderIds.slice(i, i + batchSize));
    }

    // If only one batch, use simple query
    if (batches.length === 1) {
      const ordersQuery = query(
        collection(db, 'orders'),
        where(documentId(), 'in', batches[0])
      );

      const unsubscribeFn = onSnapshot(
        ordersQuery,
        (snapshot) => {
          // Skip if this is from cache and we already have the data
          if (snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites) {
            return;
          }
          
          const orders: Order[] = snapshot.docs.map((doc) => mapDoc(doc));
          const isFromCache = snapshot.metadata.fromCache;
          
          
          // Auto-cleanup: Remove completed orders from tracking (only on server data)
          if (!isFromCache) {
            const completedOrderIds = orders
              .filter(o => o.status === 'completed')
              .map(o => o.id);
            
            if (completedOrderIds.length > 0) {
              const userId = localStorage.getItem(USER_ID_KEY);
              if (userId) {
                completedOrderIds.forEach(orderId => {
                  removeTrackedOrder(userId, orderId).catch(error => {
                    console.error('📦 [TRACKED_ORDERS] Failed to remove completed order:', error);
                  });
                });
              }
            }
          }
          
          // Filter out completed orders from the display
          const activeOrders = orders.filter(o => o.status !== 'completed');
          
          // Save to cache (only on server data)
          if (!isFromCache) {
            saveCachedOrders(activeOrders, orderIds);
          }
          
          set({ 
            trackedOrders: activeOrders,
            isLoading: false,
            lastFetchTime: Date.now(),
          });
        },
        (error) => {
          console.error('📦 [TRACKED_ORDERS] Subscription error:', error);
          set({ isLoading: false });
        }
      );

      set({ unsubscribe: unsubscribeFn });
    } else {
      // Multiple batches - need to combine results
      const allOrders: Order[] = [];
      let completedBatches = 0;
      const unsubscribers: Unsubscribe[] = [];

      batches.forEach((batch, index) => {
        const ordersQuery = query(
          collection(db, 'orders'),
          where(documentId(), 'in', batch)
        );

        const unsubscribeFn = onSnapshot(
          ordersQuery,
          (snapshot) => {
            // Skip if this is from cache and we already have the data
            if (snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites) {
              return;
            }
            
            // Replace orders from this batch
            const batchOrders: Order[] = snapshot.docs.map((doc) => mapDoc(doc));
            const isFromCache = snapshot.metadata.fromCache;
            
            // Auto-cleanup: Remove completed orders from tracking (only on server data)
            if (!isFromCache) {
              const completedOrderIds = batchOrders
                .filter(o => o.status === 'completed')
                .map(o => o.id);
              
              if (completedOrderIds.length > 0) {
                const userId = localStorage.getItem(USER_ID_KEY);
                if (userId) {
                  completedOrderIds.forEach(orderId => {
                    removeTrackedOrder(userId, orderId).catch(error => {
                      console.error('📦 [TRACKED_ORDERS] Failed to remove completed order:', error);
                    });
                  });
                }
              }
            }
            
            // Filter out completed orders
            const activeBatchOrders = batchOrders.filter(o => o.status !== 'completed');
            
            // Remove old orders from this batch and add new ones
            const otherOrders = allOrders.filter(o => !batch.includes(o.id));
            const combinedOrders = [...otherOrders, ...activeBatchOrders];
            
            allOrders.length = 0;
            allOrders.push(...combinedOrders);
            
            completedBatches++;
            
            
            // Save to cache when all batches complete (only on server data)
            if (!isFromCache && completedBatches >= batches.length) {
              saveCachedOrders([...allOrders], orderIds);
            }
            
            set({ 
              trackedOrders: [...allOrders],
              isLoading: completedBatches < batches.length,
              lastFetchTime: Date.now(),
            });
          },
          (error) => {
            console.error(`📦 [TRACKED_ORDERS] Batch ${index + 1} error:`, error);
            completedBatches++;
            if (completedBatches >= batches.length) {
              set({ isLoading: false });
            }
          }
        );

        unsubscribers.push(unsubscribeFn);
      });

      // Create combined unsubscribe function
      const combinedUnsubscribe = () => {
        unsubscribers.forEach(unsub => unsub());
      };

      set({ unsubscribe: combinedUnsubscribe });
    }
  },

  unsubscribeFromTrackedOrders: () => {
    const state = get();
    
    if (state.unsubscribe) {
      state.unsubscribe();
      
      // Keep cache for faster reload
      set({ 
        unsubscribe: null,
        isLoading: false,
      });
    }
  },
}));

// Initialize cache on load
if (typeof window !== 'undefined') {
  const store = useTrackedOrdersStore.getState();
  store.loadFromCache();
}
