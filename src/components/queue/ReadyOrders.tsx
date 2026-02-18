import { motion, AnimatePresence } from "framer-motion";
import type { Order } from "../../types/order";
import { getOrderColor } from "../../lib/orderColors";

interface ReadyOrdersProps {
  readyOrders: Order[];
  onSelectOrder: (orderId: string) => void;
}

export default function ReadyOrders({
  readyOrders,
  onSelectOrder,
}: ReadyOrdersProps) {
  if (readyOrders.length === 0) return null;

  return (
    <section className="px-4 mt-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Ready for Pickup
          </h2>
          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-medium">
            {readyOrders.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {readyOrders.map((order) => {
              const color = getOrderColor(order.orderNumber);
              return (
                <motion.button
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => onSelectOrder(order.id)}
                  className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-2 min-h-20 cursor-pointer active:scale-95 transition-transform"
                  style={{
                    boxShadow: `0 0 20px -8px ${color.hex}`,
                  }}
                >
                  <span className="font-mono font-extrabold text-2xl sm:text-3xl text-white">
                    #{order.orderNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
                  >
                    {color.name}
                  </span>
                  <span className="text-emerald-400 text-xs font-semibold uppercase mt-1">
                    ✓ Ready
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
