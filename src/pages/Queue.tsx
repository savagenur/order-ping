import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueueOrders } from "../hooks/useQueueOrders";
import { useCartSettings } from "../hooks/useCartSettings";
import { Zap } from "lucide-react";
import WelcomePage from "../components/WelcomePage";
import LoadingSpinner from "../components/LoadingSpinner";
import QueueHeader from "../components/queue/QueueHeader";
import PinnedOrder from "../components/queue/PinnedOrder";
import ReadyOrders from "../components/queue/ReadyOrders";
import PendingOrders from "../components/queue/PendingOrders";
import QueueFooter from "../components/queue/QueueFooter";
import NotificationModal from "../components/queue/NotificationModal";
import { getNotificationPermission, subscribeToOrderNotifications } from "../lib/notifications";

const PINNED_KEY = "orderping_pinned_order";
const NOTIFICATION_SHOWN_KEY = "orderping_notification_shown";
const BRAND_URL = "/about";

export default function Queue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get("cart");

  const [pinnedOrderId, setPinnedOrderId] = useState<string | null>(() =>
    localStorage.getItem(PINNED_KEY),
  );

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // TanStack Query - realtime queue orders via Firestore onSnapshot
  const { data, isLoading } = useQueueOrders(cartId);
  
  // Fetch cart settings for footer
  const { data: cartSettings } = useCartSettings(cartId);

  const pendingOrders = data?.pendingOrders ?? [];
  const readyOrders = data?.readyOrders ?? [];
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
    setPinnedOrderId(null);
    localStorage.removeItem(PINNED_KEY);
  }, []);

  const handleCardClick = useCallback(async (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    
    if (!order) return;
    
    // Check if order status is "preparing" (pending in current codebase)
    if (order.status === 'pending') {
      setSelectedOrder(orderId);
      
      // Check if notification has already been shown for this order in this session
      const notificationShown = sessionStorage.getItem(`${NOTIFICATION_SHOWN_KEY}_${orderId}`);
      
      if (!notificationShown) {
        // Check if notification permission is already granted
        const permission = getNotificationPermission();
        
        if (permission === 'granted') {
          // Automatically subscribe without showing modal
          try {
            const result = await subscribeToOrderNotifications(orderId);
            if (result.success) {
              // Successfully subscribed to notifications
            } else {
              console.error('Auto-subscription failed:', result.error);
            }
          } catch (error) {
            console.error('Error auto-subscribing to notifications:', error);
          }
        } else if (permission === 'default') {
          // Check if user has previously dismissed the notification modal
          const modalDismissed = sessionStorage.getItem(`${NOTIFICATION_SHOWN_KEY}_${orderId}_dismissed`);
          if (!modalDismissed) {
            // Show modal to ask for permission
            setTimeout(() => {
              setShowAuthModal(true);
            }, 1000);
          }
        }
        // If permission is denied, do nothing
        
        // Mark that notification has been processed for this order in this session
        sessionStorage.setItem(`${NOTIFICATION_SHOWN_KEY}_${orderId}`, 'true');
      }
    }
    
    // Still allow normal order selection for all orders
    setPinnedOrderId(orderId);
    localStorage.setItem(PINNED_KEY, orderId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [allOrders]);

  // Filter pinned order out of the section lists to avoid duplication
  const filteredReadyOrders = readyOrders.filter(
    (o) => o.id !== pinnedOrderId,
  );
  // Keep pinned order in pending list so it remains visible

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

      <PinnedOrder order={pinnedOrder} onClear={handleClearPinned} queuePosition={queuePosition} />

      <ReadyOrders
        readyOrders={filteredReadyOrders}
        onSelectOrder={handleCardClick}
      />

      <PendingOrders
        pendingOrders={pendingOrders}
        onSelectOrder={handleCardClick}
      />

      {/* Branding - positioned above the fixed footer */}
      <div className="pb-32">
        <a
          href={BRAND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-8 opacity-60 hover:opacity-100 transition-all duration-300 text-[10px] tracking-widest text-zinc-500 hover:text-blue-400 font-semibold"
        >
          <Zap className="w-3 h-3" />
          POWERED BY ORDERPING
        </a>
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
        onNotify={() => {
          // Handle notification logic here (e.g., subscribe to notifications)
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
