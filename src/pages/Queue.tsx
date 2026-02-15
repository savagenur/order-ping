import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';

export default function Queue() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [myOrder, setMyOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Listen to pending orders
    const pendingQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
          orderDetails: data.orderDetails,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          readyAt: data.readyAt?.toDate(),
        });
      });
      setPendingOrders(orders);
    });

    // Listen to ready orders
    const readyQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'ready'),
      orderBy('readyAt', 'desc')
    );

    const unsubscribeReady = onSnapshot(readyQuery, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
          orderDetails: data.orderDetails,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          readyAt: data.readyAt?.toDate(),
        });
      });
      setReadyOrders(orders);
    });

    return () => {
      unsubscribePending();
      unsubscribeReady();
    };
  }, []);

  const handleSearch = () => {
    const allOrders = [...pendingOrders, ...readyOrders];
    const found = allOrders.find(
      (order) => order.phoneNumber.replace(/\D/g, '').includes(searchPhone.replace(/\D/g, ''))
    );
    setMyOrder(found || null);
  };

  const getPosition = (orderId: string) => {
    return pendingOrders.findIndex((order) => order.id === orderId) + 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">OrderPing</h1>
          <p className="text-gray-600">Live Order Queue</p>
        </div>

        {/* Search Your Order */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Check Your Order</h2>
          <div className="flex gap-3">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <p className="font-semibold text-gray-900">{myOrder.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {myOrder.orderDetails || 'Your order'}
                  </p>
                </div>
                <div className="text-right">
                  {myOrder.status === 'pending' && (
                    <div>
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Position #{getPosition(myOrder.id)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">In Queue</p>
                    </div>
                  )}
                  {myOrder.status === 'ready' && (
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ✓ Ready for Pickup!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {searchPhone && !myOrder && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              No order found with this phone number
            </p>
          )}
        </div>

        {/* Ready for Pickup */}
        {readyOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Ready for Pickup</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {readyOrders.length} {readyOrders.length === 1 ? 'order' : 'orders'}
              </span>
            </div>
            <div className="space-y-3">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      {order.orderDetails && (
                        <p className="text-sm text-gray-600">{order.orderDetails}</p>
                      )}
                    </div>
                    <div className="text-green-700 font-bold">✓ READY</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Orders Queue */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Queue</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {pendingOrders.length} {pendingOrders.length === 1 ? 'order' : 'orders'}
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
                    {index + 1}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                    {order.orderDetails && (
                      <p className="text-sm text-gray-600">{order.orderDetails}</p>
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
        </div>
      </div>
    </div>
  );
}