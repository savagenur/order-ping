import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useDashboardOrders } from "../hooks/useDashboardOrders";
import { useAddOrder, useMarkReady, useMarkAllReady, useMarkCompleted } from "../hooks/useOrderMutations";
import type { OrderInput } from "../types/order";
import UserMenu from "../components/dashboard/UserMenu";
import OrderForm from "../components/dashboard/OrderForm";
import OrdersGrid from "../components/dashboard/OrdersGrid";
import QRCodeModal from "../components/dashboard/QRCodeModal";
import LogoutModal from "../components/dashboard/LogoutModal";

export default function Dashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [formData, setFormData] = useState<OrderInput>({
    customerName: "",
    phoneNumber: "",
    orderDetails: "",
  });
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  // Zustand auth store - single source of truth for user/cart info
  const { cartId, cartName, loading: cartLoading, logout } = useAuthStore();

  // TanStack Query - realtime orders via Firestore onSnapshot
  const { data: orders = [] } = useDashboardOrders(cartId);

  // Mutations
  const addOrder = useAddOrder();
  const markReady = useMarkReady();
  const markAllReady = useMarkAllReady();
  const markCompleted = useMarkCompleted();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cartId || !cartName) {
      alert("Cart information not found. Please contact administrator.");
      return;
    }

    // Validate phone number only if provided
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      await addOrder.mutateAsync({ formData, cartId, cartName });
      setFormData({ customerName: "", phoneNumber: "", orderDetails: "" });
    } catch (error) {
      console.error("Error adding order:", error);
      alert("Failed to add order");
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await markReady.mutateAsync(orderId);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order");
    }
  };

  const handleMarkAllReady = async () => {
    try {
      const pendingOrders = orders.filter(order => order.status === "pending");
      await markAllReady.mutateAsync(pendingOrders);
    } catch (error) {
      console.error("Error updating orders:", error);
      alert("Failed to update orders");
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      await markCompleted.mutateAsync(orderId);
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
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


  return (
    <div className="min-h-screen min-w-screen xl:min-w-[90vw] bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OrderPing</h1>
              <p className="text-sm text-gray-600">{cartName}</p>
            </div>
            <div className="flex max-md:flex-col-reverse gap-3">
              <UserMenu
                cartName={cartName}
                onLogout={() => setShowLogoutModal(true)}
                onShowQR={() => setShowQR(true)}
                onWorkerStats={() => navigate("/worker-stats")}
                onAnalytics={() => navigate("/analytics")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrderForm
          formData={formData}
          loading={addOrder.isPending}
          onFormChange={setFormData}
          onSubmit={handleSubmit}
          onPhoneChange={handlePhoneChange}
        />

        <OrdersGrid
          orders={orders}
          onMarkReady={handleMarkReady}
          onMarkCompleted={handleMarkCompleted}
          onMarkAllReady={handleMarkAllReady}
        />
      </div>

      <LogoutModal
        show={showLogoutModal}
        cartName={cartName}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <QRCodeModal
        show={showQR}
        cartName={cartName}
        cartId={cartId}
        onClose={() => setShowQR(false)}
      />
    </div>
  );
}
