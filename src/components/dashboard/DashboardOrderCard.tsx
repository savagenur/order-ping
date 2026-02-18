import { motion } from "framer-motion";
import type { Order } from "../../types/order";
import { getOrderColorByName } from "../../lib/orderColors";

interface DashboardOrderCardProps {
  order: Order;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
}

export default function DashboardOrderCard({
  order,
  actionLabel,
  actionColor,
  onAction,
}: DashboardOrderCardProps) {
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
