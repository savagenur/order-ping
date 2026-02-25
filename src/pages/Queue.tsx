import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueueOrders } from "../hooks/useQueueOrders";
import { useCartSettings } from "../hooks/useCartSettings";
import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import WelcomePage from "../components/WelcomePage";
import LoadingSpinner from "../components/LoadingSpinner";
import QueueHeader from "../components/queue/QueueHeader";
import ActiveTracking from "../components/queue/ActiveTracking";
import ReadyOrders from "../components/queue/ReadyOrders";
import PendingOrders from "../components/queue/PendingOrders";
import QueueFooter from "../components/queue/QueueFooter";
import NotificationModal from "../components/queue/NotificationModal";
import { getNotificationPermission, requestNotificationPermission, subscribeToOrderNotifications, unsubscribeFromOrderNotifications } from "../lib/notifications";
import { ACTIVE_CART_KEY, USER_ID_KEY } from "../lib/pwaUtils";
import { writeSelectedOrder, addTrackedOrder, removeTrackedOrder } from "../lib/userSync";
import { useTrackedOrdersStore } from "../stores/trackedOrdersStore";
import type { Order } from "../types/order";

const NOTIFICATION_SHOWN_KEY = "orderping_notification_shown";
const SESSION_NOTIFICATION_SHOWN_KEY = "orderping_session_notification_shown";
const BRAND_URL = "/about";

export default function Queue() {
  const currentUserIdRef = useRef<string | undefined>(localStorage.getItem(USER_ID_KEY) ?? undefined);
  const currentUserId = currentUserIdRef.current;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Resolve cartId: always read from localStorage (QRHandler writes it before
  // redirecting here, so the URL is already clean by the time this renders).
  const initialCartId = localStorage.getItem(ACTIVE_CART_KEY);
  const [cartId, setCartId] = useState<string | null>(initialCartId);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lastSubscribedOrder, setLastSubscribedOrder] = useState<string | null>(() => {
    // Restore from localStorage if available
    return localStorage.getItem('orderping_last_subscribed');
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [clickingOrderId, setClickingOrderId] = useState<string | null>(null);

  // Get tracked orders from global store
  const { trackedOrders } = useTrackedOrdersStore();


  // Keep cartId in sync if localStorage changes in another tab or after a
  // same-tab restaurant switch (storage event fires cross-tab only, so we
  // also poll on focus for the same-tab case).
  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem(ACTIVE_CART_KEY);
      
      setCartId((prev) => {
        if (prev !== stored) {
          // Clear old query data when cartId changes
          if (prev) {
            queryClient.invalidateQueries({ queryKey: ['queue-orders', prev] });
            queryClient.invalidateQueries({ queryKey: ['cart-settings', prev] });
          }
          
          setShowAuthModal(false);
          setSelectedOrder(null);
          
          return stored;
        }
        return prev;
      });
    };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, [queryClient, cartId]);

  // Consume orders from global centralized store
  const { data, isLoading } = useQueueOrders();
  
  // Fetch cart settings for footer
  const { data: cartSettings } = useCartSettings(cartId);

  const pendingOrders = useMemo(() => data?.pendingOrders ?? [], [data]);
  const readyOrders = useMemo(() => data?.readyOrders ?? [], [data]);
  const cartName = data?.cartName ?? "";

  const allOrders = useMemo(() => [...pendingOrders, ...readyOrders], [pendingOrders, readyOrders]);

  // Fallback timeout to clear loading state if something goes wrong
  useEffect(() => {
    if (clickingOrderId) {
      const timeout = setTimeout(() => {
        setClickingOrderId(null);
      }, 3000); // 3 second fallback
      return () => clearTimeout(timeout);
    }
  }, [clickingOrderId]);

  // Handle clicking a tracked order - navigate to its cart
  const handleTrackedOrderClick = useCallback((order: Order) => {
    if (order.cartId !== cartId) {
      // Switch to the order's cart
      localStorage.setItem(ACTIVE_CART_KEY, order.cartId);
      setCartId(order.cartId);
      
      // Update user doc with new cart
      if (currentUserId) {
        writeSelectedOrder(currentUserId, order.cartId).catch(console.error);
      }
      
      // Invalidate queries for smooth transition
      queryClient.invalidateQueries({ queryKey: ['queue-orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart-settings'] });
      
      // Fire synthetic focus event
      window.dispatchEvent(new Event('focus'));
    }
    
    // Scroll to top to see the order in the queue
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cartId, currentUserId, queryClient]);

  // Handle removing a tracked order
  const handleRemoveTrackedOrder = useCallback(async (orderId: string) => {
    if (currentUserId) {
      try {
        await removeTrackedOrder(currentUserId, orderId);
        console.log('🗑️ [QUEUE] Removed order from tracking:', orderId);
      } catch (error) {
        console.error('🗑️ [QUEUE] Failed to remove tracked order:', error);
      }
    }
  }, [currentUserId]);

  const handleCardClick = useCallback(async (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    // Prevent rapid double-clicks (debounce)
    const now = Date.now();
    if (now - lastClickTime < 500) {
      return;
    }
    setLastClickTime(now);
    
    // Show loading state immediately
    setClickingOrderId(orderId);
    
    // Add order to tracked orders list for multi-cart tracking
    if (currentUserId) {
      try {
        await addTrackedOrder(currentUserId, orderId);
        console.log('🎯 [QUEUE] Added order to tracked list:', orderId);
      } catch (error) {
        console.error('🎯 [QUEUE] Failed to add tracked order:', error);
      }
    }
    
    // Clear loading state after a short delay
    setTimeout(() => {
      setClickingOrderId(null);
    }, 500);
    
    // Check if order status is "preparing" (pending in current codebase)
    if (order.status === 'pending') {
      setSelectedOrder(orderId);
      
      // Prevent multiple subscription attempts in quick succession
      if (isSubscribing) {
        return;
      }
      
      // Check if notification permission is already granted
      const permission = getNotificationPermission();
      
      if (permission === 'granted') {
        // Set flag to prevent concurrent subscription attempts
        setIsSubscribing(true);
        
        try {
          // IMPORTANT: First unsubscribe from previous order if it exists and is different
          if (lastSubscribedOrder && lastSubscribedOrder !== orderId) {
            try {
              await unsubscribeFromOrderNotifications(lastSubscribedOrder, currentUserId);
            } catch (unsubError) {
              // Continue even if unsubscribe fails
            }
            
            // Small delay to ensure unsubscribe completes before subscribe
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Then subscribe to the new order
          const subscribeResult = await subscribeToOrderNotifications(orderId, currentUserId);
          
          if (subscribeResult.success) {
            // Only update last subscribed order if subscription was successful
            setLastSubscribedOrder(orderId);
            
            // Store in localStorage to persist across page refreshes
            localStorage.setItem('orderping_last_subscribed', orderId);
          } else {
            // Subscription failed
          }
        } catch (error) {
          // Error in notification flow
        } finally {
          // Always reset the subscribing flag
          setIsSubscribing(false);
        }
      } else if (permission === 'default') {
        // Check if notification has already been shown in this session
        const sessionNotificationShown = sessionStorage.getItem(SESSION_NOTIFICATION_SHOWN_KEY);
        // Check if user has previously dismissed the notification modal for this specific order
        const modalDismissed = sessionStorage.getItem(`${NOTIFICATION_SHOWN_KEY}_${orderId}_dismissed`);
        
        // Only show modal if: 1) Not shown in current session AND 2) Not dismissed for this specific order
        if (!sessionNotificationShown && !modalDismissed) {
          // Mark that notification has been shown in this session
          sessionStorage.setItem(SESSION_NOTIFICATION_SHOWN_KEY, 'true');
          // Show modal to ask for permission
          setTimeout(() => {
            setShowAuthModal(true);
          }, 500);
        }
      }
      // If permission is denied, do nothing
    }
    
    // Scroll to top after selection
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [allOrders, lastSubscribedOrder, isSubscribing, lastClickTime, currentUserId]);

  // Filter tracked orders out of the section lists to avoid duplication
  const trackedOrderIds = new Set(trackedOrders.map(o => o.id));
  const filteredReadyOrders = readyOrders.filter((o) => !trackedOrderIds.has(o.id));
  const filteredPendingOrders = pendingOrders.filter((o) => !trackedOrderIds.has(o.id));

  // Cleanup: unsubscribe from notifications when cart changes or component unmounts
  useEffect(() => {
    // Only run cleanup if we have a valid cart and last subscribed order
    if (!cartId || !lastSubscribedOrder) return;
    
    return () => {
      // Only unsubscribe if we're switching to a different cart or unmounting
      if (lastSubscribedOrder) {
        unsubscribeFromOrderNotifications(lastSubscribedOrder, currentUserId)
          .then(() => {
            // Clear localStorage on successful unsubscribe
            localStorage.removeItem('orderping_last_subscribed');
          })
          .catch(() => {
            // Error unsubscribing
          });
      }
    };
  }, [cartId, lastSubscribedOrder, currentUserId]);

  // RENDER LOGIC
  if (!cartId) {
    return <WelcomePage />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen min-w-screen bg-zinc-950 pt-16 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <QueueHeader cartName={cartName} />

      {/* Active Tracking - Global header showing all tracked orders */}
      <ActiveTracking 
        trackedOrders={trackedOrders}
        onOrderClick={handleTrackedOrderClick}
        onRemoveOrder={handleRemoveTrackedOrder}
        currentCartId={cartId}
      />

      {/* Contextual hint - shows only when no order is tracked */}
      {trackedOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-4 mt-4 mb-6"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-blue-600/20 border border-blue-400/40 rounded-2xl px-6 py-4 shadow-lg shadow-blue-500/10">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            
            {/* Content */}
            <div className="relative">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center justify-center gap-3"
              >
                <img 
                  src="/pointer.svg" 
                  alt="Pointer" 
                  className="w-8 h-8 drop-shadow-lg"
                />
                <p className="text-blue-200 font-semibold text-base tracking-wide">
                  Select your order to get notified when it's ready
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      <ReadyOrders
        readyOrders={filteredReadyOrders}
        onSelectOrder={handleCardClick}
        clickingOrderId={clickingOrderId}
      />

      <PendingOrders
        pendingOrders={filteredPendingOrders}
        onSelectOrder={handleCardClick}
        isLoading={isLoading}
        clickingOrderId={clickingOrderId}
      />

      {/* Branding - positioned above the fixed footer */}
      <div className="pb-32">
        <button
          onClick={() => navigate(BRAND_URL)}
          className="flex items-center justify-center gap-2 py-8 w-full opacity-50 hover:opacity-90 transition-opacity duration-300 text-[10px] tracking-widest text-zinc-500 hover:text-blue-400 font-semibold cursor-pointer"
        >
          <Zap className="w-3 h-3" />
          POWERED BY ORDERPING
        </button>
      </div>

      <QueueFooter 
        settings={cartSettings || {}}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // Mark that user dismissed the modal for this order
          if (selectedOrder) {
            sessionStorage.setItem(`${NOTIFICATION_SHOWN_KEY}_${selectedOrder}_dismissed`, 'true');
          }
        }}
        onNotify={async () => {
          // Handle notification subscription with improved reliability
          if (selectedOrder && !isSubscribing) {
            setIsSubscribing(true);
            
            try {
              // IMPORTANT: First unsubscribe from previous order if it exists and is different
              if (lastSubscribedOrder && lastSubscribedOrder !== selectedOrder) {
                try {
                  await unsubscribeFromOrderNotifications(lastSubscribedOrder, currentUserId);
                } catch (unsubError) {
                  // Continue even if unsubscribe fails
                }
                
                // Small delay to ensure unsubscribe completes before subscribe
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              // Request permission first - this will show the browser dialog if needed
              const permissionResult = await requestNotificationPermission(currentUserId);
              
              if (!permissionResult.success) {
                // Throw error so modal can catch it and show error state
                throw new Error(permissionResult.error || 'Permission denied');
              }
              
              
              // Then subscribe to the new order (permission already granted, so no dialog)
              const subscribeResult = await subscribeToOrderNotifications(selectedOrder, currentUserId);
              
              if (subscribeResult.success) {
                // Only update last subscribed order if subscription was successful
                setLastSubscribedOrder(selectedOrder);
                
                // Store in localStorage to persist across page refreshes
                localStorage.setItem('orderping_last_subscribed', selectedOrder);
              } else {
                // Throw error so modal can show error state
                throw new Error(subscribeResult.error || 'Subscription failed');
              }
            } catch (error) {
              // Error in notification flow
            } finally {
              // Always reset the subscribing flag
              setIsSubscribing(false);
            }
          }
        }}
        orderId={selectedOrder}
      />


      {/* Original footer content - now hidden since we have the fixed footer */}
      <div className="sr-only">
        <footer className="text-center pb-8 pt-4 px-4 space-y-1">
          <p className="text-zinc-600 text-xs">
            Updates automatically • No refresh needed
          </p>
          <p className="text-xs text-zinc-600">
            Are you a worker?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-500 hover:text-blue-400 font-medium underline transition-colors cursor-pointer"
            >
              Login here
            </button>
          </p>
          <p className="text-xs text-zinc-700">Contact: usalife609@gmail.com</p>
        </footer>
      </div>
    </div>
  );
}
