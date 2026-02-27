import { memo } from "react";
import { RotateCcw } from "lucide-react";
import type { Order } from "../../types/order";
import { OrderCard } from "../admin/OrderCard";

interface OrderListProps {
  orders: Order[];
  onMarkReady: (orderId: string) => void;
  onMarkCompleted: (orderId: string) => void;
  onUndo?: () => void;
  onRetryDeclined?: (orderId: string) => void;
  restoredOrderIds?: Set<string>;
}

const OrderList = memo(function OrderList({
  orders,
  onMarkReady,
  onMarkCompleted,
  onUndo,
  onRetryDeclined,
  restoredOrderIds = new Set(),
}: OrderListProps) {
  const preparingOrders = orders.filter((o) => o.status === "pending");
  const declinedOrders = orders.filter((o) => o.status === "declined");
  const readyOrders = orders
    .filter((o) => o.status === "ready")
    .sort((a, b) => {
      const aTime = a.readyAt instanceof Date ? a.readyAt.getTime() : 0;
      const bTime = b.readyAt instanceof Date ? b.readyAt.getTime() : 0;
      return bTime - aTime;
    });

  return (
    <div className="max-w-lg mx-auto px-4 pb-6 space-y-6">
      {/* Preparing Section */}
      <section>
        <div className="sticky top-0 z-10 flex items-center justify-between mb-3 bg-zinc-950/90 backdrop-blur-md py-2 -mx-4 px-4">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Preparing
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-xs font-medium">
              {preparingOrders.length + declinedOrders.length}
            </span>
          </div>
        </div>

        {preparingOrders.length === 0 && declinedOrders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-zinc-600 text-sm">No orders being prepared</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Show declined orders first (for attention) */}
            {declinedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="preparing"
                onAction={() => onRetryDeclined?.(order.id)}
                isGhost={restoredOrderIds.has(order.id)}
              />
            ))}
            {/* Then show pending orders */}
            {preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="preparing"
                onAction={() => onMarkReady(order.id)}
                isGhost={restoredOrderIds.has(order.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ready Section */}
      <section>
        <div className="sticky top-0 z-10 flex items-center justify-between mb-3 bg-zinc-950/90 backdrop-blur-md py-2 -mx-4 px-4">
          <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Ready for Pickup
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              className="p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center bg-[#1D2B44] text-white hover:bg-[#2A3A5A] active:bg-[#0F1A2A]"
              style={{ WebkitTapHighlightColor: "transparent" }}
              title="Undo last completed order"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
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
            {readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="ready"
                onAction={() => onMarkCompleted(order.id)}
                isGhost={restoredOrderIds.has(order.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
});

export default OrderList;
