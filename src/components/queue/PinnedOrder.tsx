import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Order } from "../../types/order";
import { getOrderColor, getOrderColorByName } from "../../lib/orderColors";

const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

interface PinnedOrderProps {
  order: Order | null;
  onClear: () => void;
  queuePosition?: number;
}

export default function PinnedOrder({ order, onClear, queuePosition }: PinnedOrderProps) {
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!order) {
      prevStatusRef.current = null;
      return;
    }

    // Vibrate when status changes to "ready"
    if (
      order.status === "ready" &&
      prevStatusRef.current !== null &&
      prevStatusRef.current !== "ready"
    ) {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    prevStatusRef.current = order.status;
  }, [order?.status, order]);

  if (!order) return null;

  const color = order.color ? getOrderColorByName(order.color) : getOrderColor(order.orderNumber);
  const isReady = order.status === "ready";

  return (
    <AnimatePresence>
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="px-4 pt-4"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            My Order
          </p>

          <div
            className={`relative rounded-2xl border-2 p-5 ${color.border} ${color.glow} bg-zinc-900 ${
              isReady ? "animate-pulse-glow" : ""
            }`}
            style={
              isReady
                ? {
                    boxShadow: `0 0 30px -5px ${color.hex}, 0 0 60px -10px ${color.hex}`,
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 sm:w-20 h-16 rounded-xl flex items-center justify-center font-mono font-extrabold text-xl sm:text-2xl text-white`}
                  style={{ backgroundColor: color.hex }}
                >
                  #{order.orderNumber}
                </div>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
                  >
                    {color.name}
                  </span>
                  <p className="text-white font-semibold text-lg mt-1">
                    {order.customerName}
                  </p>
                  {order.orderDetails && (
                    <p className="text-zinc-400 text-sm">{order.orderDetails}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                {isReady ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    <span className="inline-block px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-bold uppercase">
                      Ready!
                    </span>
                  </motion.div>
                ) : (
                  <div>
                    <span className="inline-block px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium uppercase">
                      Preparing
                    </span>
                    {queuePosition && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2"
                      >
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800/50 rounded-md border border-zinc-700/50 backdrop-blur-sm">
                          <span className="text-xs font-medium text-zinc-300">
                            {queuePosition}{getOrdinalSuffix(queuePosition)} in queue
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Clear button */}
            <button
              onClick={onClear}
              className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1 min-h-11 flex items-center justify-center cursor-pointer"
            >
              Not your order?{" "}
              <span className="underline ml-1 font-medium">Change</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
