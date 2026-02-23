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

// Cache configuration
const METRICS_CACHE_KEY = 'analytics_metrics_cache';
const CACHE_VERSION = 'v1';
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutes for historical data

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

// Cache helpers
function getCacheKey(cartId: string, period: string): string {
  return `${METRICS_CACHE_KEY}_${CACHE_VERSION}_${cartId}_${period}`;
}

function getCachedMetrics(cartId: string, period: string, startDate: Date) {
  try {
    const cacheKey = getCacheKey(cartId, period);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const { data, timestamp, dateRange } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Only use cache if it's fresh and for the same date range
    if (age < CACHE_DURATION_MS && dateRange === startDate.toISOString()) {
      return data;
    }
    
    // Clean up stale cache
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

function setCachedMetrics(cartId: string, period: string, startDate: Date, data: ReturnType<typeof calculateMetricsFromOrders>) {
  try {
    const cacheKey = getCacheKey(cartId, period);
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      dateRange: startDate.toISOString(),
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function fetchOrderMetricsOptimized(cartId: string, startDate: Date, now: Date, period: string) {
  // Check cache first for historical data (not today)
  const isHistorical = startDate < new Date(new Date().setHours(0, 0, 0, 0));
  if (isHistorical) {
    const cached = getCachedMetrics(cartId, period, startDate);
    if (cached) {
      return cached;
    }
  }
  
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
  let metrics;
  if (totalOrders > 5000) {
    metrics = await fetchMetricsWithSampling(cartId, startDate, now, totalOrders);
  } else {
    // 3. For medium datasets, fetch only essential fields
    metrics = await fetchMetricsEssentialFields(cartId, startDate, now);
  }
  
  // Cache historical data
  if (isHistorical) {
    setCachedMetrics(cartId, period, startDate, metrics);
  }
  
  return metrics;
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
  
  // Determine if this is historical data (not including today)
  const isHistorical = startDate < new Date(new Date().setHours(0, 0, 0, 0));
  const metricsStaleTime = isHistorical ? 1000 * 60 * 60 : 1000 * 60 * 5; // 1 hour for historical, 5 min for current
  const ordersStaleTime = isHistorical ? 1000 * 60 * 30 : 1000 * 60 * 2; // 30 min for historical, 2 min for current

  // Fetch pre-calculated metrics for the period (optimized with localStorage cache)
  const metricsQuery = useQuery({
    queryKey: ['analytics-metrics', cartId, selectedPeriod],
    queryFn: () => fetchOrderMetricsOptimized(cartId, startDate, now, selectedPeriod),
    enabled: !!cartId,
    staleTime: metricsStaleTime,
  });

  // Fetch paginated orders for display (only when not fetching all)
  const paginatedOrdersQuery = useQuery({
    queryKey: ['analytics-orders', cartId, selectedPeriod, page, fetchAll],
    queryFn: () => fetchOrders(cartId, startDate, now, ordersPerPage, page, fetchAll),
    enabled: !!cartId && !fetchAll,
    placeholderData: keepPreviousData,
    staleTime: ordersStaleTime,
  });

  // Fetch all orders when "Show All" is clicked
  const allOrdersQuery = useQuery({
    queryKey: ['analytics-orders-all', cartId, selectedPeriod],
    queryFn: () => fetchOrders(cartId, startDate, now, undefined, undefined, true),
    enabled: !!cartId && fetchAll,
    staleTime: ordersStaleTime,
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
