import type { Order } from "../../types/order";
import OrderCard from "./OrderCard";

interface OrdersGridProps {
  orders: Order[];
  onMarkReady: (orderId: string) => void;
  onMarkCompleted: (orderId: string) => void;
}

export default function OrdersGrid({ 
  orders, 
  onMarkReady, 
  onMarkCompleted 
}: OrdersGridProps) {
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter((o) => o.status === "completed");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pending Orders */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending ({pendingOrders.length})
        </h2>
        <div className="space-y-3">
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onMarkReady={onMarkReady}
            />
          ))}
          {pendingOrders.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              No pending orders
            </p>
          )}
        </div>
      </div>

      {/* Ready Orders */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ready ({readyOrders.length})
        </h2>
        <div className="space-y-3">
          {readyOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onMarkCompleted={onMarkCompleted}
            />
          ))}
          {readyOrders.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              No ready orders
            </p>
          )}
        </div>
      </div>

      {/* Completed Orders */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Completed ({completedOrders.length})
        </h2>
        <div className="space-y-3">
          {completedOrders.slice(0, 10).map((order) => (
            <OrderCard
              key={order.id}
              order={order}
            />
          ))}
          {completedOrders.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              No completed orders
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
