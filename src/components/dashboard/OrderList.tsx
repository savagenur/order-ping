import { useState, memo } from "react";
import type { Order } from "../../types/order";
import { getOrderColorByName } from "../../lib/orderColors";

interface OrderListProps {
  orders: Order[];
  onMarkReady: (orderId: string) => void;
  onMarkCompleted: (orderId: string) => void;
  onMarkAllReady: () => void;
  onMarkAllCompleted: () => void;
  bulkActionLoading?: {
    markingAllReady?: boolean;
    markingAllCompleted?: boolean;
  };
}

interface BulkButtonState {
  readyConfirm: boolean;
  completedConfirm: boolean;
}

const OrderList = memo(function OrderList({
  orders,
  onMarkReady,
  onMarkCompleted,
  onMarkAllReady,
  onMarkAllCompleted,
  bulkActionLoading = {},
}: OrderListProps) {
  const [buttonState, setButtonState] = useState<BulkButtonState>({
    readyConfirm: false,
    completedConfirm: false,
  });
  const preparingOrders = orders.filter((o) => o.status === "pending");
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
            {preparingOrders.length > 0 && (
              <button
                onClick={() => {
                  if (buttonState.readyConfirm) {
                    onMarkAllReady();
                    setButtonState(prev => ({ ...prev, readyConfirm: false }));
                  } else {
                    setButtonState(prev => ({ ...prev, readyConfirm: true }));
                    setTimeout(() => {
                      setButtonState(prev => ({ ...prev, readyConfirm: false }));
                    }, 3000);
                  }
                }}
                disabled={bulkActionLoading.markingAllReady}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border-2 ${
                  buttonState.readyConfirm
                    ? "bg-amber-500 text-white border-amber-400 hover:bg-amber-400 active:bg-amber-600"
                    : "bg-transparent text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-white active:bg-emerald-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {bulkActionLoading.markingAllReady
                  ? "Marking..."
                  : buttonState.readyConfirm
                  ? "Tap Again to Confirm!"
                  : "Mark All Ready"}
              </button>
            )}
            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-xs font-medium">
              {preparingOrders.length}
            </span>
          </div>
        </div>

        {preparingOrders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-zinc-600 text-sm">No orders being prepared</p>
          </div>
        ) : (
          <div className="space-y-2">
            {preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actionLabel="Set Ready"
                actionColor="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
                onAction={() => onMarkReady(order.id)}
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
            {readyOrders.length > 0 && (
              <button
                onClick={() => {
                  if (buttonState.completedConfirm) {
                    onMarkAllCompleted();
                    setButtonState(prev => ({ ...prev, completedConfirm: false }));
                  } else {
                    setButtonState(prev => ({ ...prev, completedConfirm: true }));
                    setTimeout(() => {
                      setButtonState(prev => ({ ...prev, completedConfirm: false }));
                    }, 3000);
                  }
                }}
                disabled={bulkActionLoading.markingAllCompleted}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border-2 ${
                  buttonState.completedConfirm
                    ? "bg-amber-500 text-white border-amber-400 hover:bg-amber-400 active:bg-amber-600"
                    : "bg-transparent text-zinc-400 border-zinc-400 hover:bg-zinc-400 hover:text-white active:bg-zinc-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {bulkActionLoading.markingAllCompleted
                  ? "Completing..."
                  : buttonState.completedConfirm
                  ? "Tap Again to Confirm!"
                  : "Mark All Picked Up"}
              </button>
            )}
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
                actionLabel="Complete"
                actionColor="bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700"
                onAction={() => onMarkCompleted(order.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
});

export default OrderList;

function OrderCard({
  order,
  actionLabel,
  actionColor,
  onAction,
}: {
  order: Order;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
}) {
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
