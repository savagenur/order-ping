import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, ListOrdered, QrCode, LogOut, BarChart3, Users } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useDashboardStore } from "../stores/dashboardStore";
import { useDashboardOrders } from "../hooks/useDashboardOrders";
import { useAddNumpadOrder, useMarkReady, useMarkCompleted } from "../hooks/useOrderMutations";
import { useNextOrderNumber } from "../hooks/useNextOrderNumber";
import NumpadInput from "../components/dashboard/NumpadInput";
import OrderList from "../components/dashboard/OrderList";
import QRCodeModal from "../components/dashboard/QRCodeModal";
import LogoutModal from "../components/dashboard/LogoutModal";
import type { Order } from "../types/order";
import { getOrderColorByName } from "../lib/orderColors";

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
  
  // Calculate order counts and filtered lists
  const preparingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders
    .filter((o) => o.status === "ready")
    .sort((a, b) => {
      const aTime = a.readyAt instanceof Date ? a.readyAt.getTime() : 0;
      const bTime = b.readyAt instanceof Date ? b.readyAt.getTime() : 0;
      return bTime - aTime;
    });

  // Count badges for tabs
  const preparingCount = preparingOrders.length;
  const readyCount = readyOrders.length;
  const listCount = preparingCount + readyCount;

  // Bulk action loading state
  const bulkActionLoading = {
    markingAllReady: preparingCount > 0 && preparingCount === orders.filter(o => o.status === "pending" && markReady.isPending).length,
    markingAllCompleted: readyCount > 0 && readyCount === orders.filter(o => o.status === "ready" && markCompleted.isPending).length,
  };

  // Set initial input to next order number only on first load
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
      alert("Failed to add order");
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await markReady.mutateAsync(orderId);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order");
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      await markCompleted.mutateAsync(orderId);
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order");
    }
  };

  const handleMarkAllReady = async () => {
    const preparingOrders = orders.filter((o) => o.status === "pending");
    if (preparingOrders.length === 0) return;

    try {
      await Promise.all(preparingOrders.map(order => markReady.mutateAsync(order.id)));
    } catch (error) {
      console.error("Error marking all orders ready:", error);
      alert("Failed to mark some orders ready");
    }
  };

  const handleMarkAllCompleted = async () => {
    const readyOrders = orders.filter((o) => o.status === "ready");
    if (readyOrders.length === 0) return;

    try {
      await Promise.all(readyOrders.map(order => markCompleted.mutateAsync(order.id)));
    } catch (error) {
      console.error("Error completing all orders:", error);
      alert("Failed to complete some orders");
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && activeTab === "create") {
      setActiveTab("list");
    } else if (direction === "right" && activeTab === "list") {
      setActiveTab("create");
    }
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
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white leading-tight tracking-normal normal-case">
              OrderPing
            </h1>
            <p className="text-xs text-zinc-400 font-medium">{cartName}</p>
          </div>

          {/* Menu toggle */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-sm font-medium text-white">{cartName}</p>
                      <p className="text-xs text-zinc-500 truncate">Chef Dashboard</p>
                    </div>
                    <div className="py-1">
                      <MenuButton icon={<QrCode className="w-4 h-4" />} label="QR Code" onClick={() => { setShowQR(true); setShowMenu(false); }} />
                      <MenuButton icon={<Users className="w-4 h-4" />} label="Worker Stats" onClick={() => { navigate("/worker-stats"); setShowMenu(false); }} />
                      <MenuButton icon={<BarChart3 className="w-4 h-4" />} label="Analytics" onClick={() => { navigate("/analytics"); setShowMenu(false); }} />
                      <div className="hidden md:block border-t border-zinc-800 my-1"></div>
                      <MenuButton 
                        icon={layoutMode === '3-panel' ? <ListOrdered className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />} 
                        label={layoutMode === '3-panel' ? '2 Panel Layout' : '3 Panel Layout'} 
                        onClick={() => { 
                          setLayoutMode(prev => prev === '3-panel' ? '2-panel' : '3-panel'); 
                          setShowMenu(false); 
                        }} 
                      />
                      <MenuButton icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={() => { setShowLogoutModal(true); setShowMenu(false); }} danger />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Tab-based layout */}
        <div className="md:hidden h-full">
          <AnimatePresence mode="wait">
            {activeTab === "create" ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-hidden touch-action: manipulation overscroll-behavior-none"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.x < -50 || velocity.x < -500) {
                    handleSwipe("left");
                  }
                }}
              >
                <NumpadInput
                  onSubmit={handleAddOrder}
                  loading={addNumpadOrder.isPending}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.x > 50 || velocity.x > 500) {
                    handleSwipe("right");
                  }
                }}
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
              </motion.div>
            )}
          </AnimatePresence>
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
              <div className="w-1/3 border-r border-zinc-800 overflow-y-auto">
                <div className="max-w-lg mx-auto px-4 py-6">
                  {/* Preparing Section */}
                  <section>
                    <div className="sticky top-0 z-10 flex items-center justify-between mb-3 bg-zinc-950/90 backdrop-blur-md py-2 -mx-4 px-4">
                      <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        Preparing
                      </h2>
                      <div className="flex items-center gap-2">
                        {preparingOrders.length > 0 && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
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
                          </motion.button>
                        )}
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-xs font-medium">
                          {preparingOrders.length}
                        </span>
                      </div>
                    </div>

                    {preparingOrders.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-zinc-600 text-sm">No orders being prepared</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {preparingOrders.map((order) => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              actionLabel="Set Ready"
                              actionColor="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
                              onAction={async () => await markReady.mutateAsync(order.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </section>
                </div>
              </div>
              
              {/* Right Panel - Ready */}
              <div className="w-1/3 overflow-y-auto">
                <div className="max-w-lg mx-auto px-4 py-6">
                  {/* Ready Section */}
                  <section>
                    <div className="sticky top-0 z-10 flex items-center justify-between mb-3 bg-zinc-950/90 backdrop-blur-md py-2 -mx-4 px-4">
                      <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Ready for Pickup
                      </h2>
                      <div className="flex items-center gap-2">
                        {readyOrders.length > 0 && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
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
                          </motion.button>
                        )}
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-medium">
                          {readyOrders.length}
                        </span>
                      </div>
                    </div>

                    {readyOrders.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-zinc-600 text-sm">No orders ready</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {readyOrders.map((order) => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              actionLabel="Complete"
                              actionColor="bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700"
                              onAction={async () => await markCompleted.mutateAsync(order.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </section>
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
              <div className="w-1/2 overflow-y-auto">
                <OrderList
                  orders={orders}
                  onMarkReady={handleMarkReady}
                  onMarkCompleted={handleMarkCompleted}
                  onMarkAllReady={handleMarkAllReady}
                  onMarkAllCompleted={handleMarkAllCompleted}
                  bulkActionLoading={bulkActionLoading}
                />
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
          />
          <TabButton
            active={activeTab === "list"}
            onClick={() => setActiveTab("list")}
            icon={<ListOrdered className="w-4 h-4" />}
            label="List"
            badge={listCount > 0 ? listCount : undefined}
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
    </div>
  );
}

/* ─── Helper Components ─── */

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative cursor-pointer ${
        active
          ? "text-blue-400"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold leading-none">
          {badge}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 text-sm flex items-center gap-2.5 transition cursor-pointer ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function OrderCard({
  order,
  actionLabel,
  actionColor,
  onAction,
}: {
  order: Order;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
}) {
  const color = getOrderColorByName(order.color || "BLUE");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 ${color.glow}`}
      style={{ 
        borderLeftWidth: 4, 
        borderLeftColor: color.hex,
        boxShadow: `0 0 20px -5px var(--tw-shadow-color)`
      }}
    >
      {/* Order Number + Color Badge */}
      <div className="shrink-0 flex flex-col items-start gap-1">
        <span className="font-mono font-extrabold text-3xl text-white">
          #{order.orderNumber}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
        >
          {color.name}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {order.customerName && (
          <p className="text-zinc-400 text-sm truncate">{order.customerName}</p>
        )}
        {order.orderDetails && (
          <p className="text-zinc-600 text-xs truncate">{order.orderDetails}</p>
        )}
      </div>

      {/* Action Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onAction}
        className={`shrink-0 px-5 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-wider cursor-pointer ${actionColor}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {actionLabel}
      </motion.button>
    </motion.div>
  );
}
