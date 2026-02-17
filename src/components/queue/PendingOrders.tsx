import type { Order } from "../../types/order";

interface PendingOrdersProps {
  pendingOrders: Order[];
}

export default function PendingOrders({ pendingOrders }: PendingOrdersProps) {
  const getOrdinalSuffix = (index: number) => {
    switch (index) {
      case 0:
        return "st";
      case 1:
        return "nd";
      case 2:
        return "rd";
      default:
        return "th";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Current Queue
        </h2>
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          {pendingOrders.length}{" "}
          {pendingOrders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="mt-2 text-gray-500">No orders in queue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingOrders.map((order, index) => (
            <div
              key={order.id}
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                #{order.orderNumber}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-lg">
                    {order.customerName}
                  </p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {index + 1}
                    {getOrdinalSuffix(index)} in line
                  </span>
                </div>
                {order.orderDetails && (
                  <p className="text-sm text-gray-600">
                    {order.orderDetails}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ordered at {order.createdAt?.toLocaleTimeString()}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  Preparing
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
