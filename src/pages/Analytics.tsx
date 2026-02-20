import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useAnalyticsOrders } from "../hooks/useAnalyticsOrders";
import OrderMetricsOptimized from "../components/analytics/OrderMetricsOptimized";
import TimeMetricsOptimized from "../components/analytics/TimeMetricsOptimized";
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
    metrics,
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
        <div className="text-lg text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!cartId || !cartName) {
    return <CartNotConfigured />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <Link 
                to="/dashboard" 
                className="text-sm text-blue-400 hover:text-blue-300 mb-2 inline-block transition"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Business Analytics</h1>
              <p className="text-sm text-zinc-400">OrderPing Performance Metrics</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {isLoading ? (
          <AnalyticsLoading />
        ) : (
          <>
            <OrderMetricsOptimized metrics={metrics} />
            {/* RevenueAnalytics orders={orders} /> */}
            {/* CustomerAnalytics orders={orders} /> */}
            <PerformanceAnalytics orders={orders} />
            <TimeMetricsOptimized metrics={metrics} />

            {/* Order Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Order Details
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-zinc-400">
                    {totalOrders} orders found
                  </div>
                  {totalOrders > ORDERS_PER_PAGE && (
                    <button
                      onClick={handleShowAllToggle}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium transition"
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
