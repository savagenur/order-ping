import type { Order } from "../../types/order";
import { getTime, toLocaleDateString, toLocaleTimeString } from "../../utils/dateUtils";

interface OrderDetailsProps {
  orders: Order[];
}

export default function OrderDetails({ orders }: OrderDetailsProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
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
      <table className="min-w-full divide-y divide-zinc-700">
        <thead className="bg-zinc-800">
          <tr>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
              Time
            </th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
              Time to Complete
            </th>
          </tr>
        </thead>
        <tbody className="bg-zinc-900 divide-y divide-zinc-700">
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
    <div className="border border-zinc-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-300">
          #{order.orderNumber}
        </span>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-zinc-400 truncate">{order.customerName}</p>
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
        <span>{toLocaleDateString(order.createdAt)} {toLocaleTimeString(order.createdAt)}</span>
        {timeToComplete !== null && (
          <span className="text-zinc-400 font-medium">{timeToComplete} min</span>
        )}
      </div>
    </div>
  );
}

function OrderTableRow({ order }: { order: Order }) {
  const timeToComplete = calculateTimeToComplete(order);

  return (
    <tr className="hover:bg-zinc-800 transition-colors">
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-zinc-300">
        {order.orderNumber}
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-zinc-400">
        <span className="block max-w-28 md:max-w-none truncate">
          {order.customerName}
        </span>
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-zinc-400">
        {toLocaleDateString(order.createdAt)}
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-zinc-400 hidden md:table-cell">
        {toLocaleTimeString(order.createdAt)}
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-zinc-400 hidden lg:table-cell">
        {timeToComplete !== null ? `${timeToComplete} min` : "-"}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const getStatusClasses = (status: Order['status']) => {
    switch (status) {
      case "completed":
        return "bg-green-900 text-green-300";
      case "ready":
        return "bg-blue-900 text-blue-300";
      default:
        return "bg-yellow-900 text-yellow-300";
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
