import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  updateDoc,
  doc,
  Timestamp,
  where,
  orderBy,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { getNextOrderNumber } from "../types/orderUtils";
import type { Order, OrderInput } from "../types/order";
import { useUserCart } from "../hooks/useUserCart";

export default function Dashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState<OrderInput>({
    customerName: "",
    phoneNumber: "",
    orderDetails: "",
  });
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();
  const { cartId, cartName, loading: cartLoading } = useUserCart();

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, ""); // Remove all non-digits

    if (phoneNumber.length === 0) return "";
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6)
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phoneNumber: formatted });
  };

  // Validate phone number has 10 digits
  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10;
  };

  useEffect(() => {
    if (!cartId) return;

    // Simplified query - filter by cartId only, sort in memory
    const q = query(
      collection(db, "orders"),
      where("cartId", "==", cartId),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          orderNumber: data.orderNumber || 0,
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
          orderDetails: data.orderDetails,
          status: data.status,
          cartId: data.cartId,
          cartName: data.cartName,
          createdAt: data.createdAt?.toDate(),
          readyAt: data.readyAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        });
      });

      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [cartId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!cartId || !cartName) {
      alert("Cart information not found. Please contact administrator.");
      setLoading(false);
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(formData.phoneNumber)) {
      alert("Please enter a valid 10-digit phone number");
      setLoading(false);
      return;
    }

    try {
      // Get next order number for today
      const orderNumber = await getNextOrderNumber(cartId);

      await addDoc(collection(db, "orders"), {
        orderNumber: orderNumber,
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        orderDetails: formData.orderDetails || "",
        status: "pending",
        cartId: cartId,
        cartName: cartName,
        createdAt: Timestamp.now(),
      });

      setFormData({ customerName: "", phoneNumber: "", orderDetails: "" });
    } catch (error) {
      console.error("Error adding order:", error);
      alert("Failed to add order");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "ready",
        readyAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order");
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "completed",
        completedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getQRCodeUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/queue?cart=${cartId}`;
  };

  const downloadQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getQRCodeUrl())}`;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${cartId}-qr-code.png`;
    link.click();
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!cartId || !cartName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Cart Not Configured
          </h2>
          <p className="text-gray-700 mb-4">
            Your account is not associated with a cart. Please contact your
            administrator to set up your cart ID.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter((o) => o.status === "completed");

  return (
    <div className="min-h-screen min-w-[95vw] sm:min-w-[90vw] bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OrderPing</h1>
              <p className="text-sm text-gray-600">{cartName}</p>
            </div>
            <div className="flex max-md:flex-col-reverse gap-3">
              <button
                onClick={() => setShowQR(true)}
                className="border border-blue-600 text-blue-600 hover:bg-blue-600/10 px-4 py-2 text-sm  rounded-md  transition"
              >
                View QR Code
              </button>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="px-4 py-2 text-sm border border-red-700 text-red-700 hover:bg-red-700/5  rounded-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Order Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add New Order
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  required
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
              <div>
                <label
                  htmlFor="orderDetails"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Order Details (Optional)
                </label>
                <input
                  type="text"
                  id="orderDetails"
                  value={formData.orderDetails}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDetails: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2x Burger, 1x Fries"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Adding..." : "Add Order"}
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
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-bold">
                          #{order.orderNumber}
                        </span>
                        <h3 className="font-semibold text-gray-900">
                          {order.customerName}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.phoneNumber}
                      </p>
                      {order.orderDetails && (
                        <p className="text-sm text-gray-700 mt-1">
                          {order.orderDetails}
                        </p>
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
                <p className="text-gray-500 text-sm text-center py-8">
                  No pending orders
                </p>
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
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-bold">
                          #{order.orderNumber}
                        </span>
                        <h3 className="font-semibold text-gray-900">
                          {order.customerName}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.phoneNumber}
                      </p>
                      {order.orderDetails && (
                        <p className="text-sm text-gray-700 mt-1">
                          {order.orderDetails}
                        </p>
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
                <p className="text-gray-500 text-sm text-center py-8">
                  No ready orders
                </p>
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
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-300"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-bold">
                          #{order.orderNumber}
                        </span>
                        <h3 className="font-semibold text-gray-900">
                          {order.customerName}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.phoneNumber}
                      </p>
                      {order.orderDetails && (
                        <p className="text-sm text-gray-700 mt-1">
                          {order.orderDetails}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Completed: {order.completedAt?.toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {completedOrders.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">
                  No completed orders
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 z-60">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to log out of <strong>{cartName}</strong>?
                You will need to sign in again to manage orders.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Your QR Code</h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">{cartName}</p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getQRCodeUrl())}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-xs text-gray-500 mt-4 mb-4">
                {getQRCodeUrl()}
              </p>
              <button
                onClick={downloadQRCode}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
