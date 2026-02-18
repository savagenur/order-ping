import { useState } from "react";
import { useUserCart } from "../hooks/useUserCart";
import { useOrders } from "../hooks/useOrders";
import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import OrderMetrics from "../components/analytics/OrderMetrics";
import TimeMetrics from "../components/analytics/TimeMetrics";
import PerformanceAnalytics from "../components/analytics/PerformanceAnalytics";
import OrderDetails from "../components/analytics/OrderDetails";
import AnalyticsLoading from "../components/analytics/AnalyticsLoading";
import CartNotConfigured from "../components/analytics/CartNotConfigured";
import Pagination from "../components/Pagination";

export default function Analytics() {
  const { cartId, cartName, loading: cartLoading } = useUserCart();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const ORDERS_PER_PAGE = 10;
  
  const {
    loading,
    orders,
    currentPage,
    totalOrders,
    handlePageChange,
    totalPages,
  } = useOrders({
    cartId: cartId || "",
    selectedPeriod,
    ordersPerPage: ORDERS_PER_PAGE,
  });

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!cartId || !cartName) {
    return <CartNotConfigured />;
  }

  return (
    <div className="min-h-screen w-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <AnalyticsHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        {loading ? (
          <AnalyticsLoading />
        ) : (
          <>
            <OrderMetrics orders={orders} />
            <PerformanceAnalytics orders={orders} />
            <TimeMetrics orders={orders} />

            {/* Order Details */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                Order Details
              </h2>
              <OrderDetails orders={orders} />

              {/* Pagination */}
              {totalOrders > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalOrders}
                  itemsPerPage={ORDERS_PER_PAGE}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
