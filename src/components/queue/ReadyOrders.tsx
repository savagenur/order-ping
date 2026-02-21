import { motion, AnimatePresence } from "framer-motion";
import type { Order } from "../../types/order";
import { getOrderColorByName } from "../../lib/orderColors";

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
    <section className="px-3 mt-6">
      <div className="max-w-2xl mx-auto px-3 sm:px-5">

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Pulsing live dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Ready for Pickup
            </h2>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">
            {readyOrders.length}
          </span>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {readyOrders.map((order, index) => {
              const color = getOrderColorByName(order.color || "BLUE");
              return (
                <motion.button
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -16 }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 24,
                    delay: index * 0.05,
                  }}
                  onClick={() => onSelectOrder(order.id)}
                  className="relative flex flex-col items-center justify-center gap-2 rounded-2xl p-4 cursor-pointer text-center bg-zinc-900 border-2 border-emerald-500/40 active:scale-95"
                  style={{
                    boxShadow: `0 0 24px -6px ${color.hex}, 0 0 0 0 rgba(16,185,129,0)`,
                    willChange: "transform",
                    WebkitTapHighlightColor: "transparent",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  {/* Outer glow ring — CSS animation for broad browser support */}
                  <span
                    className="absolute inset-0 rounded-2xl border-2 border-emerald-400/30 animate-pulse"
                    style={{ animationDuration: "2s" }}
                  />

                  {/* Checkmark badge */}
                  <motion.span
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0"
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2,
                    }}
                    style={{ willChange: "transform" }}
                  >
                    ✓
                  </motion.span>

                  {/* Order number */}
                  <span
                    className="font-mono font-extrabold text-2xl sm:text-3xl text-white leading-none"
                    style={{ textShadow: `0 0 16px ${color.hex}80` }}
                  >
                    #{order.orderNumber}
                  </span>

                  {/* Color badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
                  >
                    {color.name}
                  </span>

                  {/* Ready label */}
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                    Pick up now
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
