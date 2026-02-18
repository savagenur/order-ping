import { useState } from "react";
import type { Order } from "../../types/order";
import { Search } from "lucide-react";

interface OrderSearchProps {
  orders: Order[];
  getPosition: (orderId: string) => number;
}

export default function OrderSearch({ orders, getPosition }: OrderSearchProps) {
  const [searchName, setSearchName] = useState("");
  const [myOrder, setMyOrder] = useState<Order | null>(null);

  const handleSearch = () => {
    if (!searchName.trim()) {
      setMyOrder(null);
      return;
    }

    const found = orders.find((order) =>
      order.customerName
        .toLowerCase()
        .includes(searchName.toLowerCase().trim()),
    );
    setMyOrder(found || null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Check Your Order
      </h2>
      <div className="flex gap-3">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter your name"
          className="flex-1 px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
        />
        <button
          onClick={handleSearch}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {myOrder && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-md text-lg font-bold">
                  #{myOrder.orderNumber}
                </span>
                <p className="font-semibold text-gray-900 text-lg">
                  {myOrder.customerName}
                </p>
              </div>
              <p className="text-sm text-gray-600 ml-1">
                {myOrder.orderDetails || "Your order"}
              </p>
            </div>
            <div className="text-right">
              {myOrder.status === "pending" && (
                <div>
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Position #{getPosition(myOrder.id)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">In Queue</p>
                </div>
              )}
              {myOrder.status === "ready" && (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Ready!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {searchName && !myOrder && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          No order found with this name
        </p>
      )}
    </div>
  );
}
