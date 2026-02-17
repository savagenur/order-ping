import type { Order } from "../../types/order";

interface OrderCardProps {
  order: Order;
  onMarkReady?: (orderId: string) => void;
  onMarkCompleted?: (orderId: string) => void;
}

export default function OrderCard({ 
  order, 
  onMarkReady, 
  onMarkCompleted 
}: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-yellow-400";
      case "ready":
        return "border-green-400";
      case "completed":
        return "border-gray-300";
      default:
        return "border-gray-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getActionButton = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <button
            onClick={() => onMarkReady?.(order.id)}
            className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
          >
            Ready
          </button>
        );
      case "ready":
        return (
          <button
            onClick={() => onMarkCompleted?.(order.id)}
            className="w-full px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition"
          >
            Picked Up
          </button>
        );
      default:
        return null;
    }
  };

  const getTimeDisplay = () => {
    switch (order.status) {
      case "ready":
        return `Ready at: ${order.readyAt?.toLocaleTimeString()}`;
      case "completed":
        return `Completed: ${order.completedAt?.toLocaleTimeString()}`;
      default:
        return order.createdAt?.toLocaleTimeString();
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${getStatusColor(
        order.status
      )}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block px-2 py-1 rounded-md text-sm font-bold ${getStatusBadge(
                order.status
              )}`}
            >
              #{order.orderNumber}
            </span>
            <h3 className="font-semibold text-gray-900">
              {order.customerName}
            </h3>
          </div>
          {order.phoneNumber && (
            <p className="text-sm text-gray-600">{order.phoneNumber}</p>
          )}
          {order.orderDetails && (
            <p className="text-sm text-gray-700 mt-1">{order.orderDetails}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">{getTimeDisplay()}</p>
      {getActionButton(order.status)}
    </div>
  );
}
