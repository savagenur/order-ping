import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { Order } from "../../types/order";
import OrderCard from "./OrderCard";
import AllReadyConfirmModal from "./AllReadyConfirmModal";
import Pagination from "../Pagination";

interface OrdersGridProps {
  orders: Order[];
  onMarkReady: (orderId: string) => void;
  onMarkCompleted: (orderId: string) => void;
  onMarkAllReady: () => void;
}

export default function OrdersGrid({
  orders,
  onMarkReady,
  onMarkCompleted,
  onMarkAllReady,
}: OrdersGridProps) {
  const [showAllReadyConfirm, setShowAllReadyConfirm] = useState(false);
  const [completedPage, setCompletedPage] = useState(1);
  
  const ORDERS_PER_PAGE = 10;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders.filter((o) => o.status === "ready");

  // Filter completed orders for today only
  const allCompletedOrders = orders.filter((o) => o.status === "completed");
  const todaysCompletedOrders = allCompletedOrders.filter((order) => {
    if (!order.completedAt) return false;
    const today = new Date();
    const orderDate = order.completedAt;
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  });

  // Sort today's completed orders by completedAt date in descending order (latest first)
  const sortedTodaysCompletedOrders = [...todaysCompletedOrders].sort((a, b) => {
    const dateA = a.completedAt ? a.completedAt.getTime() : 0;
    const dateB = b.completedAt ? b.completedAt.getTime() : 0;
    return dateB - dateA; // Descending order
  });

  // Paginate completed orders
  const totalPages = Math.ceil(sortedTodaysCompletedOrders.length / ORDERS_PER_PAGE);
  const startIndex = (completedPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const currentCompletedOrders = sortedTodaysCompletedOrders.slice(startIndex, endIndex);

  // Handle page change for completed orders
  const handleCompletedPageChange = (page: number) => {
    setCompletedPage(page);
  };

  const handleConfirmAllReady = () => {
    onMarkAllReady();
    setShowAllReadyConfirm(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Pending Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Pending ({pendingOrders.length})
          </h2>
          {pendingOrders.length > 0 && (
            <button
              onClick={() => setShowAllReadyConfirm(true)}
              className="flex items-center gap-1 px-3 py-1 border border-green-600 text-green-600 text-sm rounded-md hover:bg-green-50 transition"
            >
              <CheckCircleIcon className="h-4 w-4" />
              All Ready
            </button>
          )}
        </div>
        <div className="space-y-3">
          {pendingOrders.map((order) => (
            <OrderCard key={order.id} order={order} onMarkReady={onMarkReady} />
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Completed Today ({todaysCompletedOrders.length})
          </h2>
        </div>
        <div className="space-y-3">
          {currentCompletedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {sortedTodaysCompletedOrders.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              No completed orders today
            </p>
          )}
        </div>
        
        {/* Pagination for completed orders */}
        {sortedTodaysCompletedOrders.length > ORDERS_PER_PAGE && (
          <div className="mt-4">
            <Pagination
              currentPage={completedPage}
              totalPages={totalPages}
              onPageChange={handleCompletedPageChange}
              totalItems={sortedTodaysCompletedOrders.length}
              itemsPerPage={ORDERS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AllReadyConfirmModal
        show={showAllReadyConfirm}
        pendingCount={pendingOrders.length}
        onConfirm={handleConfirmAllReady}
        onCancel={() => setShowAllReadyConfirm(false)}
      />
    </div>
  );
}
