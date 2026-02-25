import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { MapPin, X } from "lucide-react";
import type { Order } from "../../types/order";
import { getOrderColor, getOrderColorByName } from "../../lib/orderColors";

interface ActiveTrackingProps {
  trackedOrders: Order[];
  onOrderClick: (order: Order) => void;
  onRemoveOrder: (orderId: string) => void;
  currentCartId: string | null;
}

export default function ActiveTracking({ trackedOrders, onOrderClick, onRemoveOrder, currentCartId }: ActiveTrackingProps) {
  if (trackedOrders.length === 0) return null;

  // Group orders by cart
  const ordersByCart = trackedOrders.reduce((acc, order) => {
    if (!acc[order.cartId]) {
      acc[order.cartId] = [];
    }
    acc[order.cartId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const cartIds = Object.keys(ordersByCart);
  const totalOrders = trackedOrders.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-3 pt-4 pb-2"
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Active Tracking
            </span>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold">
              {totalOrders}
            </span>
          </div>
          {cartIds.length > 1 && (
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
              {cartIds.length} Carts
            </span>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {cartIds.map((cartId) => {
              const orders = ordersByCart[cartId];
              const isCurrentCart = cartId === currentCartId;

              return (
                <motion.div
                  key={cartId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-2"
                >
                  {/* Cart Label (only if multiple carts) */}
                  {cartIds.length > 1 && (
                    <div className="flex items-center gap-2 px-2">
                      <MapPin className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs font-semibold text-zinc-400">
                        {orders[0].cartName}
                      </span>
                      {isCurrentCart && (
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                  )}

                  {/* Orders for this cart */}
                  {orders.map((order) => {
                    const color = order.color
                      ? getOrderColorByName(order.color)
                      : getOrderColor(order.orderNumber);
                    const isReady = order.status === "ready";

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_event, info: PanInfo) => {
                          // Swipe to dismiss - if dragged more than 100px left
                          if (info.offset.x < -100) {
                            onRemoveOrder(order.id);
                          }
                        }}
                        className="relative"
                      >
                        {/* Delete indicator (shown when swiping) */}
                        <motion.div
                          className="absolute right-0 top-0 bottom-0 w-20 bg-red-500/20 rounded-xl flex items-center justify-end pr-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0 }}
                        >
                          <X className="w-5 h-5 text-red-400" />
                        </motion.div>

                        <motion.button
                          onClick={() => onOrderClick(order)}
                          className={`w-full relative rounded-xl border overflow-hidden bg-zinc-900/80 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                            isReady ? "border-emerald-500/60" : color.border
                          }`}
                          style={
                            isReady
                              ? { boxShadow: `0 0 20px -8px #10b981` }
                              : { boxShadow: `0 0 12px -6px ${color.hex}` }
                          }
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                        {/* Ready glow */}
                        {isReady && (
                          <span className="absolute inset-0 rounded-xl border border-emerald-400/20 animate-pulse pointer-events-none" />
                        )}

                        {/* Preparing shimmer */}
                        {!isReady && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(105deg, transparent 40%, ${color.hex}12 50%, transparent 60%)`,
                            }}
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{
                              duration: 2.4,
                              repeat: Infinity,
                              ease: "easeInOut",
                              repeatDelay: 0.8,
                            }}
                          />
                        )}

                          <div className="p-3 flex items-center gap-3">
                            {/* Order number */}
                            <div className="relative shrink-0">
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-extrabold text-white"
                                style={{ backgroundColor: color.hex }}
                              >
                                #{order.orderNumber}
                              </div>
                              {isReady && (
                                <motion.div
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                                >
                                  <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                                    <path
                                      d="M2 6l3 3 5-5"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </motion.div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
                                >
                                  {color.name}
                                </span>
                                {cartIds.length === 1 && (
                                  <span className="text-[10px] text-zinc-600">
                                    {order.cartName}
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-sm text-white leading-tight truncate">
                                {order.customerName}
                              </p>
                              {order.orderDetails && (
                                <p className="text-zinc-500 text-xs mt-0.5 truncate">
                                  {order.orderDetails}
                                </p>
                              )}
                            </div>

                            {/* Status */}
                            <div className="shrink-0 flex items-center gap-2">
                              {isReady ? (
                                <motion.div
                                  className="flex flex-col items-center gap-0.5"
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                                >
                                  <span
                                    className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide"
                                    style={{ boxShadow: "0 0 12px -2px #10b981" }}
                                  >
                                    Ready
                                  </span>
                                </motion.div>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <motion.div className="relative w-4 h-4">
                                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                                        <circle
                                          cx="10"
                                          cy="10"
                                          r="8"
                                          stroke="rgba(255,255,255,0.12)"
                                          strokeWidth="2.5"
                                        />
                                        <motion.circle
                                          cx="10"
                                          cy="10"
                                          r="8"
                                          stroke={color.hex}
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeDasharray="50.27"
                                          animate={{ strokeDashoffset: [50.27, 0, 50.27] }}
                                          transition={{
                                            duration: 1.8,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                          }}
                                        />
                                      </svg>
                                    </motion.div>
                                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                      Preparing
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Minimalistic X button */}
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveOrder(order.id);
                                }}
                                className="w-5 h-5 rounded-full bg-zinc-800/50 hover:bg-red-500/90 border border-zinc-700/50 hover:border-red-400 flex items-center justify-center transition-colors duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X className="w-3 h-3 text-zinc-500 hover:text-white" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-[10px] text-zinc-600 mt-3 uppercase tracking-wider"
        >
          Tap to view • Swipe left or tap X to remove
        </motion.p>
      </div>
    </motion.div>
  );
}
