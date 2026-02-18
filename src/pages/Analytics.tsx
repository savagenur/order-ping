import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useUserCart } from "../hooks/useUserCart";
import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import OrderMetrics from "../components/analytics/OrderMetrics";
import TimeMetrics from "../components/analytics/TimeMetrics";
import PerformanceAnalytics from "../components/analytics/PerformanceAnalytics";
import Pagination from "../components/Pagination";
import type { Order } from "../types/order";
import { getTime, toLocaleDateString, toLocaleTimeString } from "../utils/dateUtils";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const { cartId, cartName, loading: cartLoading } = useUserCart();

  const ORDERS_PER_PAGE = 10;

  // Load orders based on selected period and page
  const loadOrders = async (page: number = 1, reset: boolean = false) => {
    if (!cartId) return;

    setLoading(true);
    try {
      // Calculate date range based on selected period
      const now = new Date();
      let startDate = new Date();

      switch (selectedPeriod) {
        case "7days":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(now.getDate() - 90);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // First, get total count for the period
      if (reset) {
        const countQuery = query(
          collection(db, "orders"),
          where("cartId", "==", cartId),
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          where("createdAt", "<=", Timestamp.fromDate(now)),
        );
        const countSnapshot = await getDocs(countQuery);
        setTotalOrders(countSnapshot.size);
      }

      // Build paginated query
      let ordersQuery = query(
        collection(db, "orders"),
        where("cartId", "==", cartId),
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(now)),
        orderBy("createdAt", "desc"),
        limit(ORDERS_PER_PAGE)
      );

      // If not first page, start after last visible document
      if (page > 1 && lastVisible) {
        ordersQuery = query(
          collection(db, "orders"),
          where("cartId", "==", cartId),
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          where("createdAt", "<=", Timestamp.fromDate(now)),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(ORDERS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(ordersQuery);

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
          completedBy: data.completedBy,
        });
      });

      // Update last visible document for pagination
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }

      setOrders(ordersData);

      // Scroll to bottom after content is loaded (only for pagination, not initial load)
      if (!reset) {
        // Try multiple approaches to ensure scroll works
        requestAnimationFrame(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'auto'
          });
        });

        // Fallback: scroll again after a short delay
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'auto'
          });
        }, 50);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination when period changes
  useEffect(() => {
    setCurrentPage(1);
    setLastVisible(null);
    loadOrders(1, true);
  }, [cartId, selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadOrders(page, false);
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <AnalyticsHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        ) : (
          <>
            <OrderMetrics orders={orders} />
            <PerformanceAnalytics orders={orders} />
            <TimeMetrics orders={orders} />

            {/* Order Details Table */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Order Details
              </h2>

              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Time to Complete
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => {
                        // Calculate time to complete in minutes
                        const createdTime = getTime(order.createdAt);
                        const completedTime = order.completedAt ? getTime(order.completedAt) : null;
                        const timeToComplete = completedTime && createdTime
                          ? Math.round((completedTime - createdTime) / (1000 * 60))
                          : null;

                        return (
                          <tr key={order.id}>
                            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.orderNumber}
                            </td>
                            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="block max-w-20 sm:max-w-none truncate">
                                {order.customerName}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "ready"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {toLocaleDateString(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {toLocaleTimeString(order.createdAt)}
                            </td>
                            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                              {timeToComplete !== null
                                ? `${timeToComplete} min`
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {totalOrders > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(totalOrders / ORDERS_PER_PAGE)}
                      onPageChange={handlePageChange}
                      totalItems={totalOrders}
                      itemsPerPage={ORDERS_PER_PAGE}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No orders found for the selected period
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
