import { DeclinedOrderCard } from "./DeclinedOrderCard";

interface Order {
  id: string;
  orderNumber: string;
  customerName?: string; // Optional - Square doesn't provide this
  orderDetails?: string; // Optional - Square doesn't provide this
  paymentId?: string;
  status: "pending" | "ready" | "completed" | "declined" | "expired";
  expireAt?: Date;
  color: string;
  amount?: number; // Amount in cents
}

interface OrderCardProps {
  order: Order;
  isPublicView?: boolean;
}

export function OrderCard({ order, isPublicView = false }: OrderCardProps) {
  // Handle declined orders with special UI
  if (order.status === "declined") {
    return (
      <DeclinedOrderCard
        orderNumber={order.orderNumber}
        paymentId={order.paymentId}
        amount={order.amount}
        expireAt={order.expireAt}
        isPublicView={isPublicView}
      />
    );
  }

  // Handle expired orders (fade out or hide)
  if (order.status === "expired") {
    return null; // Don't show expired orders
  }

  // Regular order card (pending, ready, completed)
  return (
    <div
      className={`
        rounded-lg border p-4
        ${order.status === "pending" ? "bg-blue-950/20 border-blue-900/30" : ""}
        ${order.status === "ready" ? "bg-green-950/20 border-green-900/30" : ""}
        ${order.status === "completed" ? "bg-gray-800/20 border-gray-700/30" : ""}
        transition-all duration-300
      `}
    >
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-lg font-bold text-white">
          Order #{order.orderNumber}
        </h3>
        <span
          className={`
            text-xs font-medium px-2 py-1 rounded
            ${order.status === "pending" ? "bg-blue-900/50 text-blue-200" : ""}
            ${order.status === "ready" ? "bg-green-900/50 text-green-200" : ""}
            ${order.status === "completed" ? "bg-gray-700/50 text-gray-300" : ""}
          `}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {!isPublicView && order.customerName && (
        <p className="text-sm text-gray-300 mb-1">
          Customer: {order.customerName}
        </p>
      )}

      {order.orderDetails && (
        <p className="text-sm text-gray-400 line-clamp-2">
          {order.orderDetails}
        </p>
      )}
    </div>
  );
}
