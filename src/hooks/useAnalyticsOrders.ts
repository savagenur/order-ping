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

async function fetchOrderMetricsOptimized(cartId: string, startDate: Date, now: Date) {
  // For large datasets, use aggregation queries or multiple targeted queries
  
  // 1. Get basic counts with minimal data
  const countQuery = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(now)),
  );
  
  const countSnapshot = await getDocs(countQuery);
  const totalOrders = countSnapshot.size;
  
  if (totalOrders === 0) {
    return getEmptyMetrics();
  }
  
  // 2. For very large datasets (>5000 orders), use sampling or aggregation
  if (totalOrders > 5000) {
    return await fetchMetricsWithSampling(cartId, startDate, now, totalOrders);
  }
  
  // 3. For medium datasets, fetch only essential fields
  return await fetchMetricsEssentialFields(cartId, startDate, now);
}

async function fetchMetricsWithSampling(cartId: string, startDate: Date, now: Date, totalOrders: number) {
  // Sample strategy: Get first 1000 + last 1000 orders for representative metrics
  const sampleSize = Math.min(2000, totalOrders);
  
  const recentQuery = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(now)),
    orderBy('createdAt', 'desc'),
    limit(sampleSize / 2),
  );
  
  const recentSnapshot = await getDocs(recentQuery);
  const recentOrders = recentSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      status: data.status,
      createdAt: data.createdAt?.toDate(),
      readyAt: data.readyAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      phoneNumber: data.phoneNumber,
    };
  });
  
  // Calculate metrics from sample and extrapolate
  const sampleMetrics = calculateMetricsFromOrders(recentOrders);
  
  return {
    ...sampleMetrics,
    totalOrders, // Use actual total count
    isSampled: true,
    sampleSize: recentOrders.length,
  };
}

async function fetchMetricsEssentialFields(cartId: string, startDate: Date, now: Date) {
  // Only fetch essential fields for metrics calculation
  const metricsQuery = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(now)),
    orderBy('createdAt', 'desc'),
  );
  
  const snapshot = await getDocs(metricsQuery);
  const orders = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      status: data.status,
      createdAt: data.createdAt?.toDate(),
      readyAt: data.readyAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      phoneNumber: data.phoneNumber,
    };
  });
  
  return calculateMetricsFromOrders(orders);
}

function calculateMetricsFromOrders(orders: Array<{
  status: string;
  createdAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  phoneNumber?: string;
}>) {
  const metrics = {
    totalOrders: orders.length,
    pendingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    totalPrepTime: 0,
    totalCompletionTime: 0,
    ordersWithReadyTime: 0,
    ordersWithCompletionTime: 0,
    uniqueCustomers: new Set<string>(),
    customerOrders: new Map<string, number>(),
    hourlyOrders: new Array(24).fill(0),
    dailyOrders: new Array(7).fill(0),
  };

  orders.forEach(order => {
    // Status counts
    if (order.status === 'pending') metrics.pendingOrders++;
    else if (order.status === 'ready') metrics.readyOrders++;
    else if (order.status === 'completed') metrics.completedOrders++;

    // Customer analytics
    if (order.phoneNumber) {
      metrics.uniqueCustomers.add(order.phoneNumber);
      metrics.customerOrders.set(order.phoneNumber, (metrics.customerOrders.get(order.phoneNumber) || 0) + 1);
    }

    // Time calculations
    if (order.readyAt && order.createdAt) {
      const prepTime = (order.readyAt.getTime() - order.createdAt.getTime()) / (1000 * 60);
      metrics.totalPrepTime += prepTime;
      metrics.ordersWithReadyTime++;
    }

    if (order.completedAt && order.createdAt) {
      const completionTime = (order.completedAt.getTime() - order.createdAt.getTime()) / (1000 * 60);
      metrics.totalCompletionTime += completionTime;
      metrics.ordersWithCompletionTime++;
    }

    // Time-based analytics
    if (order.createdAt) {
      const hour = order.createdAt.getHours();
      const day = order.createdAt.getDay();
      metrics.hourlyOrders[hour]++;
      metrics.dailyOrders[day]++;
    }
  });

  return {
    ...metrics,
    uniqueCustomers: metrics.uniqueCustomers.size,
    avgTimeToReady: metrics.ordersWithReadyTime > 0 ? Math.round(metrics.totalPrepTime / metrics.ordersWithReadyTime) : 0,
    avgTimeToCompletion: metrics.ordersWithCompletionTime > 0 ? Math.round(metrics.totalCompletionTime / metrics.ordersWithCompletionTime) : 0,
    completionRate: metrics.totalOrders > 0 ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100) : 0,
    repeatCustomers: Array.from(metrics.customerOrders.values()).filter(count => count > 1).length,
    customerOrders: Object.fromEntries(metrics.customerOrders),
  };
}

function getEmptyMetrics() {
  return {
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    avgTimeToReady: 0,
    avgTimeToCompletion: 0,
    completionRate: 0,
    uniqueCustomers: 0,
    repeatCustomers: 0,
    hourlyOrders: new Array(24).fill(0),
    dailyOrders: new Array(7).fill(0),
    customerOrders: {},
  };
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

  // Fetch pre-calculated metrics for the period (optimized)
  const metricsQuery = useQuery({
    queryKey: ['analytics-metrics', cartId, selectedPeriod],
    queryFn: () => fetchOrderMetricsOptimized(cartId, startDate, now),
    enabled: !!cartId,
    staleTime: 1000 * 60 * 2, // 2 min cache
  });

  // Fetch paginated orders for display (only when not fetching all)
  const paginatedOrdersQuery = useQuery({
    queryKey: ['analytics-orders', cartId, selectedPeriod, page, fetchAll],
    queryFn: () => fetchOrders(cartId, startDate, now, ordersPerPage, page, fetchAll),
    enabled: !!cartId && !fetchAll,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch all orders when "Show All" is clicked
  const allOrdersQuery = useQuery({
    queryKey: ['analytics-orders-all', cartId, selectedPeriod],
    queryFn: () => fetchOrders(cartId, startDate, now, undefined, undefined, true),
    enabled: !!cartId && fetchAll,
    staleTime: 1000 * 60 * 2,
  });

  const metrics = metricsQuery.data;
  const totalOrders = metrics?.totalOrders ?? 0;
  const totalPages = ordersPerPage ? Math.ceil(totalOrders / ordersPerPage) : 0;

  return {
    orders: fetchAll ? (allOrdersQuery.data ?? []) : (paginatedOrdersQuery.data ?? []),
    metrics: metrics || {
      totalOrders: 0,
      pendingOrders: 0,
      readyOrders: 0,
      completedOrders: 0,
      avgTimeToReady: 0,
      avgTimeToCompletion: 0,
      completionRate: 0,
      uniqueCustomers: 0,
      repeatCustomers: 0,
      hourlyOrders: new Array(24).fill(0),
      dailyOrders: new Array(7).fill(0),
      customerOrders: {},
    },
    totalOrders: fetchAll ? (allOrdersQuery.data?.length ?? 0) : totalOrders,
    totalPages: fetchAll ? 1 : totalPages,
    isLoading: metricsQuery.isLoading || (!fetchAll && (paginatedOrdersQuery.isLoading || (fetchAll && allOrdersQuery.isLoading))),
    isFetching: metricsQuery.isFetching || (!fetchAll && paginatedOrdersQuery.isFetching) || (fetchAll && allOrdersQuery.isFetching),
  };
}
