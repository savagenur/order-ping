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
    <div
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
      <button
        onClick={onAction}
        className={`shrink-0 px-5 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-wider cursor-pointer ${actionColor}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
