import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useAnalyticsOrders } from "../hooks/useAnalyticsOrders";
import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import OrderMetrics from "../components/analytics/OrderMetrics";
import TimeMetrics from "../components/analytics/TimeMetrics";
import PerformanceAnalytics from "../components/analytics/PerformanceAnalytics";
import OrderDetails from "../components/analytics/OrderDetails";
import AnalyticsLoading from "../components/analytics/AnalyticsLoading";
import CartNotConfigured from "../components/analytics/CartNotConfigured";
import Pagination from "../components/Pagination";

export default function Analytics() {
  const { cartId, cartName, loading: cartLoading } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const ORDERS_PER_PAGE = 50; // Increased from 10 for better analytics experience

  const {
    orders,
    totalOrders,
    totalPages,
    isLoading,
  } = useAnalyticsOrders({
    cartId: cartId || "",
    selectedPeriod,
    fetchAll: showAllOrders,
    ordersPerPage: showAllOrders ? undefined : ORDERS_PER_PAGE,
    page: showAllOrders ? undefined : currentPage,
  });

  // Reset page when period changes
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setCurrentPage(1);
    setShowAllOrders(false); // Reset to paginated view when period changes
  };

  const handleShowAllToggle = () => {
    if (showAllOrders) {
      setShowAllOrders(false);
      setCurrentPage(1);
    } else {
      // Show warning for large datasets
      if (totalOrders > 500) {
        const confirmed = window.confirm(
          `Showing all ${totalOrders} orders may slow down your browser. 
          
Do you want to continue? You can always switch back to paginated view.`
        );
        if (confirmed) {
          setShowAllOrders(true);
        }
      } else {
        setShowAllOrders(true);
      }
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
    return <CartNotConfigured />;
  }

  return (
    <div className="min-h-screen w-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <AnalyticsHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />

        {isLoading ? (
          <AnalyticsLoading />
        ) : (
          <>
            <OrderMetrics orders={orders} />
            <PerformanceAnalytics orders={orders} />
            <TimeMetrics orders={orders} />

            {/* Order Details */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Order Details
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {totalOrders} orders found
                  </div>
                  {totalOrders > ORDERS_PER_PAGE && (
                    <button
                      onClick={handleShowAllToggle}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showAllOrders ? 'Show Paginated' : 'Show All'}
                    </button>
                  )}
                </div>
              </div>
              <OrderDetails orders={orders} />
              
              {/* Pagination - only show when not showing all orders */}
              {!showAllOrders && totalOrders > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalOrders}
                    itemsPerPage={ORDERS_PER_PAGE}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
