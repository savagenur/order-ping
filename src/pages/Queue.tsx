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
import PinnedOrder from "../components/queue/PinnedOrder";
import ReadyOrders from "../components/queue/ReadyOrders";
import PendingOrders from "../components/queue/PendingOrders";
import QueueFooter from "../components/queue/QueueFooter";
import NotificationModal from "../components/queue/NotificationModal";
import { getNotificationPermission, requestNotificationPermission, subscribeToOrderNotifications, unsubscribeFromOrderNotifications } from "../lib/notifications";
import { ACTIVE_CART_KEY, USER_ID_KEY, PWA_BANNER_DISMISSED_KEY, isStandalone, isIOSDevice, isAndroidDevice } from "../lib/pwaUtils";
import { writeSelectedOrder, readSelectedOrder } from "../lib/userSync";
import { useUserSync } from "../hooks/useUserSync";
import PWABanner from "../components/queue/PWABanner";

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

  const [pinnedOrderId, setPinnedOrderId] = useState<string | null>(null); // This will be controlled by cloud sync

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lastSubscribedOrder, setLastSubscribedOrder] = useState<string | null>(() => {
    // Restore from localStorage if available
    return localStorage.getItem('orderping_last_subscribed');
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  // PWA Banner state - show when user selects pending order
  const [showPWABanner, setShowPWABanner] = useState(false);

  // Bootstrap and sync selected order from cloud - this is the single source of truth
  useEffect(() => {
    if (currentUserId) {
      readSelectedOrder(currentUserId).then((cloudOrderId) => {
        setPinnedOrderId(cloudOrderId); // pinned order always reflects cloud selection
      });
    }
  }, []); // currentUserId is a ref-like value, not a dependency

  // Handle real-time selected order changes from Safari/PWA sync
  const handleOrderChanged = useCallback((orderId: string | null) => {
    setPinnedOrderId(orderId); // Update UI to match cloud state
  }, []);

  // Subscribe to order changes from cloud
  useUserSync({ 
    userId: currentUserId || null, 
    onCartChanged: () => {}, // Cart changes handled by App-level useUserSync
    onOrderChanged: handleOrderChanged 
  });


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
          
          // Clear selection in cloud when switching carts
          if (currentUserId) {
            writeSelectedOrder(currentUserId, '').catch(console.error);
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

  // Find the pinned order from the live data
  const pinnedOrder = pinnedOrderId
    ? allOrders.find((o) => o.id === pinnedOrderId) ?? null
    : null;

  // Calculate queue position for pinned order (only if it's pending)
  const queuePosition = pinnedOrder && pinnedOrder.status === 'pending' 
    ? pendingOrders.findIndex((o) => o.id === pinnedOrderId) + 1 
    : undefined;

  // Auto-clear pinned order if it's been completed (no longer in active lists)
  useEffect(() => {
    if (pinnedOrderId && !isLoading && allOrders.length > 0 && !pinnedOrder) {
      // Order was completed or removed — keep pinned for a grace period
      // so the user sees it disappear naturally
    }
  }, [pinnedOrderId, pinnedOrder, isLoading, allOrders.length]);

  const handleClearPinned = useCallback(() => {
    // Clear selection by writing empty string to cloud
    if (currentUserId) {
      writeSelectedOrder(currentUserId, '').catch(console.error);
    }
  }, []); // currentUserId is ref-like, not a dependency

  const handleCardClick = useCallback(async (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    
    if (!order) return;
    
    // Debounce: prevent rapid clicks within 1 second
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      return;
    }
    setLastClickTime(now);
    
    // Always write selection to cloud - UI will update via real-time sync
    if (currentUserId) {
      writeSelectedOrder(currentUserId, orderId).catch(console.error);
    }
    
    // Check if order status is "preparing" (pending in current codebase)
    if (order.status === 'pending') {
      setSelectedOrder(orderId);
      
      // Show PWA banner for mobile users when selecting pending order (once per session)
      if (!isStandalone() && (isIOSDevice() || isAndroidDevice())) {
        const sessionDismissed = sessionStorage.getItem('pwa_banner_session_dismissed');
        const permanentlyDismissed = localStorage.getItem(PWA_BANNER_DISMISSED_KEY);
        
        if (!sessionDismissed && !permanentlyDismissed) {
          // Show banner after a short delay
          setTimeout(() => {
            setShowPWABanner(true);
          }, 1000);
        }
      }
      
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
              await unsubscribeFromOrderNotifications(lastSubscribedOrder);
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
  }, [allOrders, lastSubscribedOrder, isSubscribing, lastClickTime]);

  // Handle PWA banner dismiss
  const handlePWABannerDismiss = useCallback(() => {
    setShowPWABanner(false);
    // Mark as dismissed for this session
    sessionStorage.setItem('pwa_banner_session_dismissed', 'true');
  }, []);

  // Filter pinned order out of the section lists to avoid duplication
  const filteredReadyOrders = readyOrders.filter(
    (o) => o.id !== pinnedOrderId,
  );
  // Keep pinned order in pending list so it remains visible

  // Cleanup: unsubscribe from notifications when cart changes or component unmounts
  useEffect(() => {
    // Only run cleanup if we have a valid cart and last subscribed order
    if (!cartId || !lastSubscribedOrder) return;
    
    return () => {
      // Only unsubscribe if we're switching to a different cart or unmounting
      if (lastSubscribedOrder) {
        unsubscribeFromOrderNotifications(lastSubscribedOrder)
          .then(() => {
            // Clear localStorage on successful unsubscribe
            localStorage.removeItem('orderping_last_subscribed');
          })
          .catch(() => {
            // Error unsubscribing
          });
      }
    };
  }, [cartId, lastSubscribedOrder]);

  // RENDER LOGIC
  if (!cartId) {
    return <WelcomePage />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen min-w-screen bg-zinc-950 pt-16 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* PWA Install Banner - shows when user selects pending order */}
      <PWABanner isVisible={showPWABanner} onDismiss={handlePWABannerDismiss} />
      
      <QueueHeader cartName={cartName} />

      {/* Contextual hint - shows only when no order is selected */}
      {!pinnedOrderId && (
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

      <PinnedOrder order={pinnedOrder} onClear={handleClearPinned} queuePosition={queuePosition} />

      <ReadyOrders
        readyOrders={filteredReadyOrders}
        onSelectOrder={handleCardClick}
      />

      <PendingOrders
        pendingOrders={pendingOrders}
        onSelectOrder={handleCardClick}
        isLoading={isLoading}
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
        pinnedOrderStatus={pinnedOrder?.status}
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
                  await unsubscribeFromOrderNotifications(lastSubscribedOrder);
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
