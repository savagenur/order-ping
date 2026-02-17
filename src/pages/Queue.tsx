import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { db } from "../lib/firebase";
import type { Order } from "../types/order";
import InvalidQRCode from "../components/InvalidQrCode";

// Helper function to safely map Firestore data to Order type
const mapFirestoreToOrder = (docId: string, data: DocumentData): Order => {
  return {
    id: docId,
    orderNumber: data.orderNumber || 0,
    customerName: data.customerName || "",
    phoneNumber: data.phoneNumber || "",
    orderDetails: data.orderDetails,
    status: data.status || "pending",
    cartId: data.cartId || "",
    cartName: data.cartName || "",
    createdAt: data.createdAt?.toDate() || new Date(),
    readyAt: data.readyAt?.toDate(),
    completedAt: data.completedAt?.toDate(),
  };
};

export default function Queue() {
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get("cart");

  // STATE
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [searchName, setSearchName] = useState("");
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [cartName, setCartName] = useState<string>("");

  // FIX: Initialize loading based on whether we even have a cartId to fetch
  const [loading, setLoading] = useState(!!cartId);

  useEffect(() => {
    // Guard: If no cartId, do nothing
    if (!cartId) return;

    // Optimized query: Let Firestore do the heavy lifting
    const ordersQuery = query(
      collection(db, "orders"),
      where("cartId", "==", cartId),
      orderBy("createdAt", "asc"), // Ascending for pending orders (oldest first)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const allOrders: Order[] = [];
        snapshot.forEach((doc) => {
          allOrders.push(mapFirestoreToOrder(doc.id, doc.data()));
        });

        // Set cart name from first order (if available)
        if (allOrders.length > 0 && !cartName) {
          setCartName(allOrders[0].cartName);
        }

        // Filter by status (already sorted by createdAt ascending from Firestore)
        const pending = allOrders.filter((o) => o.status === "pending");

        // Ready orders need to be sorted by readyAt (most recent first)
        const ready = allOrders
          .filter((o) => o.status === "ready")
          .sort(
            (a, b) => (b.readyAt?.getTime() || 0) - (a.readyAt?.getTime() || 0),
          );

        setPendingOrders(pending);
        setReadyOrders(ready);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [cartId, cartName]);

  const handleSearch = () => {
    if (!searchName.trim()) {
      setMyOrder(null);
      return;
    }

    const allOrders = [...pendingOrders, ...readyOrders];
    const found = allOrders.find((order) =>
      order.customerName
        .toLowerCase()
        .includes(searchName.toLowerCase().trim()),
    );
    setMyOrder(found || null);
  };

  const getPosition = (orderId: string) => {
    return pendingOrders.findIndex((order) => order.id === orderId) + 1;
  };

  // RENDER LOGIC
  if (!cartId) {
    return <InvalidQRCode />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-600">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen #f2f3f4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">OrderPing</h1>
          {cartName && (
            <p className="text-lg text-gray-700 font-medium">{cartName}</p>
          )}
          <p className="text-gray-600">Live Order Queue</p>
        </div>

        {/* Search Your Order */}
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
              className="flex-1 px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Search
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
                      ✓ Ready for Pickup!
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

        {/* Ready for Pickup */}
        {readyOrders.length > 0 && (
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
                      <span className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
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
        )}

        {/* Pending Orders Queue */}
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
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    #{order.orderNumber}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-lg">
                        {order.customerName}
                      </p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {index + 1}
                        {index === 0
                          ? "st"
                          : index === 1
                            ? "nd"
                            : index === 2
                              ? "rd"
                              : "th"}{" "}
                        in line
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

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>Updates automatically • No refresh needed</p>
          <p className="mt-2 text-xs text-gray-500">
            Contact: usalife609@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
