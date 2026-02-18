import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';
import { getStartDateForPeriod } from '../utils/dateUtils';

interface UseAnalyticsOrdersOptions {
  cartId: string;
  selectedPeriod: string;
  ordersPerPage?: number;
  page?: number;
  fetchAll?: boolean;
}

function transformOrderData(doc: QueryDocumentSnapshot): Order {
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
}

async function fetchOrderCount(cartId: string, startDate: Date, now: Date) {
  const countQuery = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(now)),
  );
  const countSnapshot = await getDocs(countQuery);
  return countSnapshot.size;
}

async function fetchOrders(
  cartId: string,
  startDate: Date,
  now: Date,
  ordersPerPage?: number,
  page?: number,
  fetchAll?: boolean,
) {
  // If fetchAll is true, fetch all orders without pagination
  if (fetchAll) {
    const allOrdersQuery = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(now)),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(allOrdersQuery);
    return snapshot.docs.map(transformOrderData);
  }

  // For paginated results (existing logic)
  if (!ordersPerPage || !page) {
    return [];
  }

  // For page > 1, we need to skip previous pages
  // Firestore doesn't support offset, so we fetch all docs up to the page boundary
  if (page === 1) {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(now)),
      orderBy('createdAt', 'desc'),
      limit(ordersPerPage),
    );
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map(transformOrderData);
  }

  // For subsequent pages, fetch up to the start of this page to get the cursor
  const skipCount = (page - 1) * ordersPerPage;
  const cursorQuery = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(now)),
    orderBy('createdAt', 'desc'),
    limit(skipCount),
  );
  const cursorSnapshot = await getDocs(cursorQuery);

  if (cursorSnapshot.docs.length < skipCount) {
    return []; // No more pages
  }

  const lastDoc = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
  const pageQuery = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(now)),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(ordersPerPage),
  );
  const snapshot = await getDocs(pageQuery);
  return snapshot.docs.map(transformOrderData);
}

export function useAnalyticsOrders({
  cartId,
  selectedPeriod,
  ordersPerPage,
  page,
  fetchAll,
}: UseAnalyticsOrdersOptions) {
  const startDate = getStartDateForPeriod(selectedPeriod);
  const now = new Date();

  // Only fetch count if not fetching all orders
  const countQuery = useQuery({
    queryKey: ['analytics-order-count', cartId, selectedPeriod],
    queryFn: () => fetchOrderCount(cartId, startDate, now),
    enabled: !!cartId && !fetchAll,
    staleTime: 1000 * 60 * 2, // 2 min cache for count
  });

  const ordersQuery = useQuery({
    queryKey: ['analytics-orders', cartId, selectedPeriod, page, fetchAll],
    queryFn: () => fetchOrders(cartId, startDate, now, ordersPerPage, page, fetchAll),
    enabled: !!cartId,
    placeholderData: keepPreviousData, // Keep old data while fetching new page
    staleTime: 1000 * 60 * 2,
  });

  const totalOrders = countQuery.data ?? 0;
  const totalPages = ordersPerPage ? Math.ceil(totalOrders / ordersPerPage) : 0;

  return {
    orders: ordersQuery.data ?? [],
    totalOrders: fetchAll ? (ordersQuery.data?.length ?? 0) : totalOrders,
    totalPages: fetchAll ? 1 : totalPages,
    isLoading: ordersQuery.isLoading || (!fetchAll && countQuery.isLoading),
    isFetching: ordersQuery.isFetching,
  };
}
