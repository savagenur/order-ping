import type { Order } from "../types/order";

interface ReadyOrdersProps {
  readyOrders: Order[];
}

export default function ReadyOrders({ readyOrders }: ReadyOrdersProps) {
  if (readyOrders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Ready for Pickup
        </h2>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          {readyOrders.length}{" "}
          {readyOrders.length === 1 ? "order" : "orders"}
        </span>
      </div>
      <div className="space-y-3">
        {readyOrders.map((order) => (
          <div
            key={order.id}
            className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  #{order.orderNumber}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {order.customerName}
                  </p>
                  {order.orderDetails && (
                    <p className="text-sm text-gray-600">
                      {order.orderDetails}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-green-700 font-bold text-xl">
                ✓ READY
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
