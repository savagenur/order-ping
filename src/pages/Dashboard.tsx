import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import type { Order, OrderInput } from '../types/order';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState<OrderInput>({
    customerName: '',
    phoneNumber: '',
    orderDetails: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
          orderDetails: data.orderDetails,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          readyAt: data.readyAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        });
      });
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'orders'), {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        orderDetails: formData.orderDetails || '',
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      setFormData({ customerName: '', phoneNumber: '', orderDetails: '' });
    } catch (error) {
      console.error('Error adding order:', error);
      alert('Failed to add order');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'ready',
        readyAt: Timestamp.now(),
      });
      // Note: SMS will be sent via Firebase Function (to be implemented)
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">OrderPing Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Order Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Order</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label htmlFor="orderDetails" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Details (Optional)
                </label>
                <input
                  type="text"
                  id="orderDetails"
                  value={formData.orderDetails}
                  onChange={(e) => setFormData({ ...formData, orderDetails: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2x Burger, 1x Fries"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Adding...' : 'Add Order'}
            </button>
          </form>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pending ({pendingOrders.length})
            </h2>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
                      <p className="text-sm text-gray-600">{order.phoneNumber}</p>
                      {order.orderDetails && (
                        <p className="text-sm text-gray-700 mt-1">{order.orderDetails}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {order.createdAt?.toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => handleMarkReady(order.id)}
                    className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                  >
                    Mark as Ready
                  </button>
                </div>
              ))}
              {pendingOrders.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">No pending orders</p>
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
                <div key={order.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
                      <p className="text-sm text-gray-600">{order.phoneNumber}</p>
                      {order.orderDetails && (
                        <p className="text-sm text-gray-700 mt-1">{order.orderDetails}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Ready at: {order.readyAt?.toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => handleMarkCompleted(order.id)}
                    className="w-full px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition"
                  >
                    Mark as Picked Up
                  </button>
                </div>
              ))}
              {readyOrders.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">No ready orders</p>
              )}
            </div>
          </div>

          {/* Completed Orders */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Completed ({completedOrders.length})
            </h2>
            <div className="space-y-3">
              {completedOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-300">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
                      <p className="text-sm text-gray-600">{order.phoneNumber}</p>
                      {order.orderDetails && (
                        <p className="text-sm text-gray-700 mt-1">{order.orderDetails}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Completed: {order.completedAt?.toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {completedOrders.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">No completed orders</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}