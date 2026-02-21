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

function PreparingIndicator({ colorHex }: { colorHex: string }) {
  return (
    <div className="flex flex-col items-end gap-2">
      {/* Spinner + label row */}
      <div className="flex items-center gap-2">
        <motion.div
          className="relative w-5 h-5"
          style={{ willChange: "transform" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10" cy="10" r="8"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2.5"
            />
            <motion.circle
              cx="10" cy="10" r="8"
              stroke={colorHex}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="50.27"
              animate={{ strokeDashoffset: [50.27, 0, 50.27] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ willChange: "stroke-dashoffset" }}
            />
          </svg>
        </motion.div>
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Preparing
        </span>
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colorHex, willChange: "opacity, transform" }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="px-3 pt-4"
        style={{ willChange: "transform, opacity" }}
      >
        <div className="max-w-2xl mx-auto px-3 sm:px-5">

          {/* Label row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              My Order
            </span>
            {isReady && (
              <motion.span
                className="relative flex h-2 w-2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </motion.span>
            )}
          </div>

          {/* Card */}
          <div
            className={`relative rounded-2xl border-2 overflow-hidden bg-zinc-900 ${
              isReady ? "border-emerald-500/60" : color.border
            }`}
            style={
              isReady
                ? { boxShadow: `0 0 40px -8px #10b981, 0 0 80px -20px #10b981` }
                : { boxShadow: `0 0 20px -10px ${color.hex}` }
            }
          >
            {/* Ready: pulsing glow ring overlay */}
            {isReady && (
              <span
                className="absolute inset-0 rounded-2xl border-2 border-emerald-400/25 animate-pulse pointer-events-none"
                style={{ animationDuration: "1.8s" }}
              />
            )}

            {/* Preparing: shimmer sweep */}
            {!isReady && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(105deg, transparent 40%, ${color.hex}18 50%, transparent 60%)`,
                  willChange: "transform",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
              />
            )}

            <div className="p-4">
              <div className="flex items-center gap-4">

                {/* Order number block */}
                <div className="relative shrink-0">
                  <div
                    className="w-16 sm:w-20 h-16 rounded-xl flex items-center justify-center font-mono font-extrabold text-xl sm:text-2xl text-white"
                    style={{ backgroundColor: color.hex }}
                  >
                    #{order.orderNumber}
                  </div>
                  {/* Ready checkmark badge on number block */}
                  {isReady && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                    >
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
                  >
                    {color.name}
                  </span>
                  <p className="text-white font-semibold text-lg mt-1 leading-tight truncate">
                    {order.customerName}
                  </p>
                  {order.orderDetails && (
                    <p className="text-zinc-400 text-sm mt-0.5 truncate">{order.orderDetails}</p>
                  )}
                </div>

                {/* Status indicator */}
                <div className="shrink-0 ml-1">
                  {isReady ? (
                    <motion.div
                      className="flex flex-col items-center gap-1.5"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                      style={{ willChange: "transform" }}
                    >
                      <span className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-sm font-bold uppercase tracking-wide"
                        style={{ boxShadow: "0 0 16px -2px #10b981" }}
                      >
                        Ready!
                      </span>
                      <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                        Pick up now
                      </span>
                    </motion.div>
                  ) : (
                    <PreparingIndicator colorHex={color.hex} />
                  )}
                </div>
              </div>

              {/* Queue position bar — preparing only */}
              {!isReady && queuePosition && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-3 flex items-center gap-3"
                >
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color.hex, willChange: "transform" }}
                      animate={{ x: ["-100%", "400%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 shrink-0">
                    {queuePosition}{getOrdinalSuffix(queuePosition)} in queue
                  </span>
                </motion.div>
              )}

              {/* Ready: full-width pickup prompt bar */}
              {isReady && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    Ready — go collect it!
                  </span>
                </motion.div>
              )}
            </div>

            {/* Clear button */}
            <button
              onClick={onClear}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-300 transition-colors py-2.5 border-t border-zinc-800 flex items-center justify-center cursor-pointer"
              style={{ WebkitTapHighlightColor: "transparent" }}
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
