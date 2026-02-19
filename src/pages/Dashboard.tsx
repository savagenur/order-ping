import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ListOrdered } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useDashboardStore } from "../stores/dashboardStore";
import { useDashboardOrders } from "../hooks/useDashboardOrders";
import { useAddNumpadOrder, useMarkReady, useMarkCompleted } from "../hooks/useOrderMutations";
import { useNextOrderNumber } from "../hooks/useNextOrderNumber";
import { useOrderFilters } from "../hooks/useOrderFilters";
import { useBulkActionLoading } from "../hooks/useBulkActionLoading";
import { useToast } from "../hooks/useToast";
import NumpadInput from "../components/dashboard/NumpadInput";
import OrderList from "../components/dashboard/OrderList";
import DashboardOrderCard from "../components/dashboard/DashboardOrderCard";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import TabButton from "../components/dashboard/TabButton";
import ToastContainer from "../components/ui/ToastContainer";
import QRCodeModal from "../components/dashboard/QRCodeModal";
import LogoutModal from "../components/dashboard/LogoutModal";

export default function Dashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [buttonState, setButtonState] = useState({
    readyConfirm: false,
    completedConfirm: false,
  });
  const [layoutMode, setLayoutMode] = useState<'2-panel' | '3-panel'>('3-panel');
  const navigate = useNavigate();
  const hasSetInitialInput = useRef(false);

  // Zustand stores
  const { cartId, cartName, loading: cartLoading, logout } = useAuthStore();
  const { activeTab, setActiveTab, currentInput, selectedColor, setInput, showSuccess } =
    useDashboardStore();

  // TanStack Query - realtime orders via Firestore onSnapshot
  const { data: orders = [] } = useDashboardOrders(cartId);
  
  // Get next order number for initial input
  const { data: nextOrderNumber } = useNextOrderNumber();

  // Mutations
  const addNumpadOrder = useAddNumpadOrder();
  const markReady = useMarkReady();
  const markCompleted = useMarkCompleted();

  // Custom hooks for filtering and bulk actions
  const { preparingOrders, readyOrders, preparingCount, readyCount, listCount } = useOrderFilters(orders);
  const bulkActionLoading = useBulkActionLoading({
    orders,
    markReady,
    markCompleted,
  });

  // Toast notifications
  const { showToast } = useToast();
  useEffect(() => {
    if (nextOrderNumber && !hasSetInitialInput.current) {
      setInput(nextOrderNumber.toString());
      hasSetInitialInput.current = true;
    }
  }, [nextOrderNumber, setInput]);

  const handleAddOrder = async () => {
    if (!cartId || !cartName || !currentInput) return;

    try {
      await addNumpadOrder.mutateAsync({
        orderNumber: parseInt(currentInput, 10),
        color: selectedColor,
        cartId,
        cartName,
      });
      
      // Use the entered order number + 1 for the next input
      const enteredNumber = parseInt(currentInput, 10);
      showSuccess(enteredNumber);
      setInput((enteredNumber + 1).toString());
    } catch (error) {
      console.error("Error adding order:", error);
      showToast("Failed to add order", "error");
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await markReady.mutateAsync(orderId);
    } catch (error) {
      console.error("Error updating order:", error);
      showToast("Failed to update order", "error");
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      await markCompleted.mutateAsync(orderId);
    } catch (error) {
      console.error("Error completing order:", error);
      showToast("Failed to complete order", "error");
    }
  };

  const handleMarkAllReady = async () => {
    const preparingOrders = orders.filter((o) => o.status === "pending");
    if (preparingOrders.length === 0) return;

    try {
      await Promise.all(preparingOrders.map(order => markReady.mutateAsync(order.id)));
    } catch (error) {
      console.error("Error marking all orders ready:", error);
      showToast("Failed to mark some orders ready", "error");
    }
  };

  const handleMarkAllCompleted = async () => {
    const readyOrders = orders.filter((o) => o.status === "ready");
    if (readyOrders.length === 0) return;

    try {
      await Promise.all(readyOrders.map(order => markCompleted.mutateAsync(order.id)));
    } catch (error) {
      console.error("Error completing all orders:", error);
      showToast("Failed to complete some orders", "error");
    }
  };


  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && activeTab === "create") {
      setActiveTab("list");
    } else if (direction === "right" && activeTab === "list") {
      setActiveTab("create");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const touchStartX = touch.clientX;
    const touchStartY = touch.clientY;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          handleSwipe("right");
        } else {
          handleSwipe("left");
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-lg text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!cartId || !cartName) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">
            Cart Not Configured
          </h2>
          <p className="text-zinc-400 mb-6">
            Your account is not associated with a cart. Please contact your
            administrator to set up your cart ID.
          </p>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-zinc-700 text-white rounded-xl hover:bg-zinc-600 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <DashboardHeader
        cartName={cartName}
        showMenu={showMenu}
        layoutMode={layoutMode}
        onMenuToggle={() => setShowMenu(!showMenu)}
        onMenuClose={() => setShowMenu(false)}
        onQRCode={() => { setShowQR(true); setShowMenu(false); }}
        onWorkerStats={() => { navigate("/worker-stats"); setShowMenu(false); }}
        onAnalytics={() => { navigate("/analytics"); setShowMenu(false); }}
        onLayoutToggle={() => { 
          setLayoutMode(prev => prev === '3-panel' ? '2-panel' : '3-panel'); 
          setShowMenu(false); 
        }}
        onLogout={() => { setShowLogoutModal(true); setShowMenu(false); }}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Tab-based layout */}
        <div className="md:hidden h-full">
          {activeTab === "create" ? (
            <div 
              className="h-full overflow-hidden touch-action: manipulation overscroll-behavior-none"
              onTouchStart={handleTouchStart}
            >
              <NumpadInput
                onSubmit={handleAddOrder}
                loading={addNumpadOrder.isPending}
              />
            </div>
          ) : (
            <div 
              className="h-full overflow-y-auto"
              onTouchStart={handleTouchStart}
            >
              <OrderList
                orders={orders}
                onMarkReady={handleMarkReady}
                onMarkCompleted={handleMarkCompleted}
                onMarkAllReady={handleMarkAllReady}
                onMarkAllCompleted={handleMarkAllCompleted}
                bulkActionLoading={{
                  markingAllReady: preparingCount > 0 && preparingCount === orders.filter(o => o.status === "pending" && markReady.isPending).length,
                  markingAllCompleted: readyCount > 0 && readyCount === orders.filter(o => o.status === "ready" && markCompleted.isPending).length,
                }}
              />
            </div>
          )}
        </div>

        {/* Tablet & Desktop: Split layout */}
        <div className="hidden md:flex h-full">
          {layoutMode === '3-panel' ? (
            // 3-Panel Layout: Create | Preparing | Ready
            <>
              {/* Left Panel - Create */}
              <div className="w-1/3 border-r border-zinc-800 overflow-y-auto">
                <NumpadInput
                  onSubmit={handleAddOrder}
                  loading={addNumpadOrder.isPending}
                />
              </div>
              
              {/* Middle Panel - Preparing */}
              <div className="w-1/3 border-r border-zinc-800 flex flex-col">
                {/* Static Header */}
                <div className="sticky top-0 z-10 shrink-0 bg-zinc-950 border-b border-zinc-800">
                  <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        Preparing
                      </h2>
                      <div className="flex items-center gap-2">
                        {preparingOrders.length > 0 && (
                          <button
                            onClick={() => {
                              if (buttonState.readyConfirm) {
                                handleMarkAllReady();
                                setButtonState(prev => ({ ...prev, readyConfirm: false }));
                              } else {
                                setButtonState(prev => ({ ...prev, readyConfirm: true }));
                                setTimeout(() => {
                                  setButtonState(prev => ({ ...prev, readyConfirm: false }));
                                }, 3000);
                              }
                            }}
                            disabled={bulkActionLoading.markingAllReady}
                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border-2 ${
                              buttonState.readyConfirm
                                ? "bg-amber-500 text-white border-amber-400 hover:bg-amber-400 active:bg-amber-600"
                                : "bg-transparent text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-white active:bg-emerald-500"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                            {bulkActionLoading.markingAllReady
                              ? "Marking..."
                              : buttonState.readyConfirm
                              ? "Tap Again to Confirm!"
                              : "Mark All Ready"}
                          </button>
                        )}
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-xs font-medium">
                          {preparingOrders.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-lg mx-auto px-4 py-6">
                    {preparingOrders.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-zinc-600 text-sm">No orders being prepared</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {preparingOrders.map((order) => (
                          <DashboardOrderCard
                            key={order.id}
                            order={order}
                            actionLabel="Set Ready"
                            actionColor="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
                            onAction={async () => await markReady.mutateAsync(order.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Panel - Ready */}
              <div className="w-1/3 flex flex-col">
                {/* Static Header */}
                <div className="sticky top-0 z-10 shrink-0 bg-zinc-950 border-b border-zinc-800">
                  <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Ready for Pickup
                      </h2>
                      <div className="flex items-center gap-2">
                        {readyOrders.length > 0 && (
                          <button
                            onClick={() => {
                              if (buttonState.completedConfirm) {
                                handleMarkAllCompleted();
                                setButtonState(prev => ({ ...prev, completedConfirm: false }));
                              } else {
                                setButtonState(prev => ({ ...prev, completedConfirm: true }));
                                setTimeout(() => {
                                  setButtonState(prev => ({ ...prev, completedConfirm: false }));
                                }, 3000);
                              }
                            }}
                            disabled={bulkActionLoading.markingAllCompleted}
                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border-2 ${
                              buttonState.completedConfirm
                                ? "bg-amber-500 text-white border-amber-400 hover:bg-amber-400 active:bg-amber-600"
                                : "bg-transparent text-zinc-400 border-zinc-400 hover:bg-zinc-400 hover:text-white active:bg-zinc-500"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                            {bulkActionLoading.markingAllCompleted
                              ? "Completing..."
                              : buttonState.completedConfirm
                              ? "Tap Again to Confirm!"
                              : "Mark All Picked Up"}
                          </button>
                        )}
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-medium">
                          {readyOrders.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-lg mx-auto px-4 py-6">
                    {readyOrders.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-zinc-600 text-sm">No orders ready</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {readyOrders.map((order) => (
                          <DashboardOrderCard
                            key={order.id}
                            order={order}
                            actionLabel="Complete"
                            actionColor="bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700"
                            onAction={async () => await markCompleted.mutateAsync(order.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // 2-Panel Layout: Create | Orders (both Preparing & Ready)
            <>
              {/* Left Panel - Create */}
              <div className="w-1/2 border-r border-zinc-800 overflow-y-auto">
                <NumpadInput
                  onSubmit={handleAddOrder}
                  loading={addNumpadOrder.isPending}
                />
              </div>
              
              {/* Right Panel - Orders */}
              <div className="w-1/2 flex flex-col">
                {/* Static Header */}
                <div className="sticky top-0 z-10 shrink-0 bg-zinc-950 border-b border-zinc-800">
                  <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Orders
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-medium">
                          {orders.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <OrderList
                    orders={orders}
                    onMarkReady={handleMarkReady}
                    onMarkCompleted={handleMarkCompleted}
                    onMarkAllReady={handleMarkAllReady}
                    onMarkAllCompleted={handleMarkAllCompleted}
                    bulkActionLoading={bulkActionLoading}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="md:hidden border-t border-zinc-800">
        <div className="max-w-lg mx-auto px-4 flex">
          <TabButton
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
            icon={<PlusCircle className="w-4 h-4" />}
            label="Create"
            position="left"
          />
          <TabButton
            active={activeTab === "list"}
            onClick={() => setActiveTab("list")}
            icon={<ListOrdered className="w-4 h-4" />}
            label="List"
            badge={listCount > 0 ? listCount : undefined}
            position="right"
          />
        </div>
      </div>

      {/* Modals */}
      <LogoutModal
        show={showLogoutModal}
        cartName={cartName}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <QRCodeModal
        show={showQR}
        cartName={cartName}
        cartId={cartId}
        onClose={() => setShowQR(false)}
      />
      <ToastContainer />
    </div>
  );
}
