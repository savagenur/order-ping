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
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Order } from "../types/order";
import { getStartDateForPeriod } from "../utils/dateUtils";

interface UseOrdersOptions {
  cartId: string;
  selectedPeriod: string;
  ordersPerPage: number;
}

export function useOrders({ cartId, selectedPeriod, ordersPerPage }: UseOrdersOptions) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);

  const transformOrderData = (doc: QueryDocumentSnapshot): Order => {
    const data = doc.data();
    return {
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
    };
  };

  const loadOrders = async (page: number = 1, reset: boolean = false) => {
    if (!cartId) return;

    setLoading(true);
    try {
      const startDate = getStartDateForPeriod(selectedPeriod);
      const now = new Date();

      // Get total count for the period
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
        limit(ordersPerPage)
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
          limit(ordersPerPage)
        );
      }

      const snapshot = await getDocs(ordersQuery);
      const ordersData = snapshot.docs.map(transformOrderData);

      // Update last visible document for pagination
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }

      setOrders(ordersData);

      // Scroll to bottom after content is loaded (only for pagination, not initial load)
      if (!reset) {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadOrders(page, false);
  };

  return {
    loading,
    orders,
    currentPage,
    totalOrders,
    handlePageChange,
    totalPages: Math.ceil(totalOrders / ordersPerPage),
  };
}
