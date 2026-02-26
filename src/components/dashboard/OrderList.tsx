import { useState, memo } from "react";
import { RotateCcw, BellRing, Loader2, CheckCheck } from "lucide-react";
import type { Order } from "../../types/order";
import { OrderCard } from "../admin/OrderCard";

interface OrderListProps {
  orders: Order[];
  onMarkReady: (orderId: string) => void;
  onMarkCompleted: (orderId: string) => void;
  onMarkAllReady: () => void;
  onMarkAllCompleted: () => void;
  onUndo?: () => void;
  onRetryDeclined?: (orderId: string) => void;
  restoredOrderIds?: Set<string>;
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
  onUndo,
  onRetryDeclined,
  restoredOrderIds = new Set(),
  bulkActionLoading = {},
}: OrderListProps) {
  const [buttonState, setButtonState] = useState<BulkButtonState>({
    readyConfirm: false,
    completedConfirm: false,
  });
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
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border-2 ${
                  buttonState.readyConfirm
                    ? "bg-amber-500 text-white border-amber-400 active:bg-amber-600"
                    : "bg-transparent text-emerald-400 border-emerald-400 active:bg-emerald-500 active:text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {bulkActionLoading.markingAllReady
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : buttonState.readyConfirm
                  ? <CheckCheck className="w-4 h-4" />
                  : <BellRing className="w-4 h-4" />}
              </button>
            )}
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
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border-2 ${
                  buttonState.completedConfirm
                    ? "bg-amber-500 text-white border-amber-400 active:bg-amber-600"
                    : "bg-transparent text-zinc-400 border-zinc-400 active:bg-zinc-500 active:text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {bulkActionLoading.markingAllCompleted
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : buttonState.completedConfirm
                  ? <CheckCheck className="w-4 h-4" />
                  : <CheckCheck className="w-4 h-4" />}
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
