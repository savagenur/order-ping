import type { Order } from "../../types/order";
import { getOrderColorByName } from "../../lib/orderColors";

interface DashboardOrderCardProps {
  order: Order;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
  isGhost?: boolean;
}

export default function DashboardOrderCard({
  order,
  actionLabel,
  actionColor,
  onAction,
  isGhost = false,
}: DashboardOrderCardProps) {
  const color = getOrderColorByName(order.color || "BLUE");

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 transition-opacity duration-1000 ${
        isGhost ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: color.hex }}
    >
      {/* Order Number + Color Badge */}
      <div className="shrink-0 flex flex-col items-start gap-1">
        <span className="font-mono font-extrabold text-4xl text-white leading-none">
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
          <p className="text-zinc-300 text-sm truncate font-medium">{order.customerName}</p>
        )}
        {order.orderDetails && (
          <p className="text-zinc-500 text-xs truncate mt-0.5">{order.orderDetails}</p>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={onAction}
        className={`shrink-0 px-6 py-4 rounded-xl text-white text-sm font-bold uppercase tracking-wider cursor-pointer ${actionColor}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
