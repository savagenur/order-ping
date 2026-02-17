import { useState } from "react";
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
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders.filter((o) => o.status === "ready");
  
  // Filter completed orders based on toggle settings
  const allCompletedOrders = orders.filter((o) => o.status === "completed");
  
  // Filter by today if the toggle is on
  const completedOrders = showOnlyToday 
    ? allCompletedOrders.filter(order => {
        if (!order.completedAt) return false;
        const today = new Date();
        const orderDate = order.completedAt;
        return orderDate.getDate() === today.getDate() &&
               orderDate.getMonth() === today.getMonth() &&
               orderDate.getFullYear() === today.getFullYear();
      })
    : allCompletedOrders;

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Completed ({completedOrders.length})
          </h2>
          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showOnlyToday}
                onChange={() => setShowOnlyToday(!showOnlyToday)}
              />
              <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-sm font-medium text-gray-500">Today only</span>
            </label>
          </div>
        </div>
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
