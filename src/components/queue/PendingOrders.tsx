import { motion, AnimatePresence } from "framer-motion";
import type { Order } from "../../types/order";
import { getOrderColorByName } from "../../lib/orderColors";
import NotificationBell from "./NotificationBell";

interface PendingOrdersProps {
  pendingOrders: Order[];
  onSelectOrder: (orderId: string) => void;
  isLoading?: boolean;
}

export default function PendingOrders({
  pendingOrders,
  onSelectOrder,
  isLoading = false,
}: PendingOrdersProps) {
  return (
    <section className="px-3 mt-6 pb-8">
      <div className="max-w-2xl mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Preparing
          </h2>
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full text-xs font-medium">
            {pendingOrders.length}
          </span>
        </div>

        {pendingOrders.length === 0 && !isLoading ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.p 
              className="text-zinc-600 text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              No orders being prepared
            </motion.p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {pendingOrders.map((order, index) => {
                const color = getOrderColorByName(order.color || "BLUE");
                const position = index + 1;
                return (
                  <motion.button
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    onClick={() => onSelectOrder(order.id)}
                    className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3 min-h-10 cursor-pointer active:scale-[0.98] transition-transform text-left relative"
                    style={{ borderLeftWidth: 4, borderLeftColor: color.hex }}
                  >
                    <NotificationBell isSubscribed={order.isSubscribed} />
                    <span className="font-mono font-extrabold text-xl sm:text-2xl text-white shrink-0 w-14 sm:w-16 text-center">
                      #{order.orderNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
                        >
                          {color.name}
                        </span>
                      </div>
                      {order.customerName && (
                        <p className="text-zinc-400 text-sm mt-0.5 truncate">
                          {order.customerName}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-[10px] sm:text-xs font-bold">
                        Position {position} of {pendingOrders.length}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
