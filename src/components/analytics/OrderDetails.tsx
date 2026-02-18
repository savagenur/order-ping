import type { Order } from "../../types/order";
import { getTime, toLocaleDateString, toLocaleTimeString } from "../../utils/dateUtils";

interface OrderDetailsProps {
  orders: Order[];
}

export default function OrderDetails({ orders }: OrderDetailsProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders found for the selected period
      </div>
    );
  }

  return (
    <>
      <MobileOrderList orders={orders} />
      <DesktopOrderTable orders={orders} />
    </>
  );
}

function MobileOrderList({ orders }: OrderDetailsProps) {
  return (
    <div className="sm:hidden space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function DesktopOrderTable({ orders }: OrderDetailsProps) {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Time
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Time to Complete
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <OrderTableRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const timeToComplete = calculateTimeToComplete(order);

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          #{order.orderNumber}
        </span>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-gray-700 truncate">{order.customerName}</p>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{toLocaleDateString(order.createdAt)} {toLocaleTimeString(order.createdAt)}</span>
        {timeToComplete !== null && (
          <span className="text-gray-600 font-medium">{timeToComplete} min</span>
        )}
      </div>
    </div>
  );
}

function OrderTableRow({ order }: { order: Order }) {
  const timeToComplete = calculateTimeToComplete(order);

  return (
    <tr>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {order.orderNumber}
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500">
        <span className="block max-w-28 md:max-w-none truncate">
          {order.customerName}
        </span>
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500">
        {toLocaleDateString(order.createdAt)}
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
        {toLocaleTimeString(order.createdAt)}
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
        {timeToComplete !== null ? `${timeToComplete} min` : "-"}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const getStatusClasses = (status: Order['status']) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "ready":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(
        status
      )}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function calculateTimeToComplete(order: Order): number | null {
  const createdTime = getTime(order.createdAt);
  const completedTime = order.completedAt ? getTime(order.completedAt) : null;
  
  return completedTime && createdTime
    ? Math.round((completedTime - createdTime) / (1000 * 60))
    : null;
}
