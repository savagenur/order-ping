import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';

type DateKey = string;

export type WorkerStatsMap = {
  [workerId: string]: {
    name: string;
    ordersByDate: {
      [date: DateKey]: number;
    };
    totalOrders: number;
    averageOrdersPerDay: number;
    bestDay: { date: DateKey; count: number };
    worstDay: { date: DateKey; count: number };
    activeDays: number;
    productivityTrend: 'increasing' | 'decreasing' | 'stable';
    hourlyDistribution: { [hour: string]: number };
    averageCompletionTime: number;
    fastestCompletion: { time: number; date: DateKey };
    slowestCompletion: { time: number; date: DateKey };
    peakHour: { hour: string; count: number };
  };
};

export type TeamAnalytics = {
  totalOrders: number;
  totalWorkers: number;
  averageOrdersPerWorker: number;
  averageOrdersPerDay: number;
  mostProductiveWorker: { id: string; name: string; count: number };
  leastProductiveWorker: { id: string; name: string; count: number };
  peakDay: { date: DateKey; count: number };
  teamEfficiency: number;
  peakHour: { hour: string; count: number };
  averageCompletionTime: number;
  hourlyDistribution: { [hour: string]: number };
};

interface WorkerDoc {
  id: string;
  email: string;
  workerName: string;
  uid: string;
}

function formatDate(date: Date): DateKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function fetchWorkers(cartId?: string): Promise<WorkerDoc[]> {
  const workersRef = collection(db, 'workers');
  let q;
  
  if (cartId) {
    q = query(workersRef, where('cartId', '==', cartId));
  } else {
    q = workersRef;
  }
  
  const snapshot = await getDocs(q);
  
  const workers = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email || 'Unknown',
      workerName: data.workerName || 'Unknown',
      uid: data.uid || 'Unknown',
    };
  });
  
  return workers;
}

async function fetchWorkerStats(
  selectedMonth: string,
  workers: WorkerDoc[],
  cartId?: string,
): Promise<{ stats: WorkerStatsMap; analytics: TeamAnalytics }> {
  // const [year, month] = selectedMonth.split('-').map(Number);

  const ordersRef = collection(db, 'orders');
  const queryConstraints = [
    where('status', '==', 'completed'),
  ];
  
  // Temporarily remove date filtering to see if any orders exist
  // where('completedAt', '>=', Timestamp.fromDate(startDate)),
  // where('completedAt', '<=', Timestamp.fromDate(endDate)),
  
  // Add cartId filter if provided
  if (cartId) {
    queryConstraints.push(where('cartId', '==', cartId));
  }
  
  const q = query(ordersRef, ...queryConstraints);

  const snapshot = await getDocs(q);
  const newStats: WorkerStatsMap = {};
  const completionTimes: number[] = [];
  const hourlyData: { [hour: string]: number } = {};

  snapshot.forEach((doc) => {
    const order = doc.data() as Order;
    
    if (!order.completedBy) return;

    const workerId = order.completedBy;
    const orderDate = order.completedAt
      ? formatDate(
          order.completedAt instanceof Date
            ? order.completedAt
            : (order.completedAt as Timestamp).toDate(),
        )
      : '';

    if (!orderDate) return;

    // Initialize worker stats
    if (!newStats[workerId]) {
      const worker = workers.find((w) => w.id === workerId || w.uid === workerId);
      newStats[workerId] = {
        name: worker?.workerName || `Worker ${workerId}`,
        ordersByDate: {},
        totalOrders: 0,
        averageOrdersPerDay: 0,
        bestDay: { date: '', count: 0 },
        worstDay: { date: '', count: 0 },
        activeDays: 0,
        productivityTrend: 'stable',
        hourlyDistribution: {},
        averageCompletionTime: 0,
        fastestCompletion: { time: Infinity, date: '' },
        slowestCompletion: { time: 0, date: '' },
        peakHour: { hour: '', count: 0 },
      };
    }

    // Count orders by date
    if (!newStats[workerId].ordersByDate[orderDate]) {
      newStats[workerId].ordersByDate[orderDate] = 0;
    }
    newStats[workerId].ordersByDate[orderDate]++;
    newStats[workerId].totalOrders++;

    // Calculate completion time if readyAt exists
    if (order.readyAt && order.completedAt) {
      const readyTime = order.readyAt instanceof Date ? order.readyAt : (order.readyAt as Timestamp).toDate();
      const completedTime = order.completedAt instanceof Date ? order.completedAt : (order.completedAt as Timestamp).toDate();
      const completionTimeMs = completedTime.getTime() - readyTime.getTime();
      const completionTimeMinutes = completionTimeMs / (1000 * 60);
      
      if (completionTimeMinutes > 0 && completionTimeMinutes < 24 * 60) { // Filter out unrealistic times
        completionTimes.push(completionTimeMinutes);
        
        // Update fastest/slowest completion
        if (completionTimeMinutes < newStats[workerId].fastestCompletion.time) {
          newStats[workerId].fastestCompletion = { time: completionTimeMinutes, date: orderDate };
        }
        if (completionTimeMinutes > newStats[workerId].slowestCompletion.time) {
          newStats[workerId].slowestCompletion = { time: completionTimeMinutes, date: orderDate };
        }
      }
    }

    // Track hourly distribution
    const completedHour = order.completedAt
      ? (order.completedAt instanceof Date ? order.completedAt : (order.completedAt as Timestamp).toDate()).getHours()
      : null;
    
    if (completedHour !== null) {
      const hourKey = completedHour.toString().padStart(2, '0');
      
      if (!newStats[workerId].hourlyDistribution[hourKey]) {
        newStats[workerId].hourlyDistribution[hourKey] = 0;
      }
      newStats[workerId].hourlyDistribution[hourKey]++;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = 0;
      }
      hourlyData[hourKey]++;
    }
  });

  // Calculate additional metrics for each worker
  Object.keys(newStats).forEach(workerId => {
    const workerStats = newStats[workerId];
    const dayCounts = Object.values(workerStats.ordersByDate);
    
    // Average orders per day
    workerStats.activeDays = dayCounts.filter(count => count > 0).length;
    workerStats.averageOrdersPerDay = workerStats.activeDays > 0 ? workerStats.totalOrders / workerStats.activeDays : 0;
    
    // Best and worst days
    const dayEntries = Object.entries(workerStats.ordersByDate);
    const bestDayEntry = dayEntries.reduce((best, current) => 
      current[1] > (best?.[1] || 0) ? current : best, ['', 0] as [DateKey, number]);
    const worstDayEntry = dayEntries.reduce((worst, current) => 
      current[1] < (worst?.[1] || Infinity) ? current : worst, ['', Infinity] as [DateKey, number]);
    
    workerStats.bestDay = { date: bestDayEntry[0], count: bestDayEntry[1] };
    workerStats.worstDay = { date: worstDayEntry[0], count: worstDayEntry[1] };
    
    // Productivity trend (simple calculation based on first vs second half of month)
    const [queryYear, queryMonth] = selectedMonth.split('-').map(Number);
    const midPoint = Math.floor(getDaysInMonth(queryYear, queryMonth) / 2);
    const firstHalfDays = dayEntries.filter(([date]) => {
      const day = parseInt(date.split('-')[2]);
      return day <= midPoint;
    });
    const secondHalfDays = dayEntries.filter(([date]) => {
      const day = parseInt(date.split('-')[2]);
      return day > midPoint;
    });
    
    const firstHalfTotal = firstHalfDays.reduce((sum, [, count]) => sum + count, 0);
    const secondHalfTotal = secondHalfDays.reduce((sum, [, count]) => sum + count, 0);
    
    if (secondHalfTotal > firstHalfTotal * 1.1) {
      workerStats.productivityTrend = 'increasing';
    } else if (firstHalfTotal > secondHalfTotal * 1.1) {
      workerStats.productivityTrend = 'decreasing';
    } else {
      workerStats.productivityTrend = 'stable';
    }
    
    // Find peak hour for this worker
    const hourEntries = Object.entries(workerStats.hourlyDistribution);
    const peakHourEntry = hourEntries.reduce((peak, current) => 
      current[1] > (peak?.[1] || 0) ? current : peak, ['', 0] as [string, number]);
    workerStats.peakHour = { hour: peakHourEntry[0], count: peakHourEntry[1] };
    
    // Reset fastest/slowest if no data
    if (workerStats.fastestCompletion.time === Infinity) {
      workerStats.fastestCompletion = { time: 0, date: '' };
    }
  });
  
  // Calculate team analytics
  const totalOrders = Object.values(newStats).reduce((sum, worker) => sum + worker.totalOrders, 0);
  const totalWorkers = Object.keys(newStats).length;
  const averageOrdersPerWorker = totalWorkers > 0 ? totalOrders / totalWorkers : 0;
  const [analyticsYear, analyticsMonth] = selectedMonth.split('-').map(Number);
  const daysInMonth = getDaysInMonth(analyticsYear, analyticsMonth);
  const averageOrdersPerDay = totalOrders / daysInMonth;
  
  // Calculate average completion time
  const averageCompletionTime = completionTimes.length > 0 
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
    : 0;
  
  // Find most and least productive workers
  let mostProductiveWorker = { id: '', name: '', count: 0 };
  let leastProductiveWorker = { id: '', name: '', count: Infinity };
  
  Object.entries(newStats).forEach(([id, worker]) => {
    if (worker.totalOrders > mostProductiveWorker.count) {
      mostProductiveWorker = { id, name: worker.name, count: worker.totalOrders };
    }
    if (worker.totalOrders < leastProductiveWorker.count) {
      leastProductiveWorker = { id, name: worker.name, count: worker.totalOrders };
    }
  });
  
  if (leastProductiveWorker.count === Infinity) {
    leastProductiveWorker = { id: '', name: '', count: 0 };
  }
  
  // Find peak day for the team
  const dailyTotals: { [date: DateKey]: number } = {};
  Object.values(newStats).forEach(worker => {
    Object.entries(worker.ordersByDate).forEach(([date, count]) => {
      dailyTotals[date] = (dailyTotals[date] || 0) + count;
    });
  });
  
  const peakDayEntry = Object.entries(dailyTotals).reduce((peak, current) => 
    current[1] > (peak?.[1] || 0) ? current : peak, ['', 0] as [DateKey, number]);
  
  // Find peak hour for the team
  const peakHourEntry = Object.entries(hourlyData).reduce((peak, current) => 
    current[1] > (peak?.[1] || 0) ? current : peak, ['', 0] as [string, number]);
  
  const analytics: TeamAnalytics = {
    totalOrders,
    totalWorkers,
    averageOrdersPerWorker,
    averageOrdersPerDay,
    mostProductiveWorker,
    leastProductiveWorker,
    peakDay: { date: peakDayEntry[0], count: peakDayEntry[1] },
    teamEfficiency: totalWorkers > 0 ? (totalOrders / (totalWorkers * daysInMonth)) * 100 : 0,
    peakHour: { hour: peakHourEntry[0], count: peakHourEntry[1] },
    averageCompletionTime,
    hourlyDistribution: hourlyData,
  };
  
  return { stats: newStats, analytics };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function useWorkersQuery(cartId?: string) {
  return useQuery({
    queryKey: ['workers', cartId],
    queryFn: () => fetchWorkers(cartId),
    staleTime: 1000 * 60 * 10, // 10 min - workers don't change often
  });
}

export function useWorkerStatsQuery(selectedMonth: string, workers: WorkerDoc[], cartId?: string) {
  return useQuery({
    queryKey: ['worker-stats', selectedMonth, workers.map((w) => w.id), cartId],
    queryFn: () => fetchWorkerStats(selectedMonth, workers, cartId),
    enabled: workers.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTeamAnalyticsQuery(selectedMonth: string, workers: WorkerDoc[], cartId?: string) {
  return useQuery({
    queryKey: ['team-analytics', selectedMonth, workers.map((w) => w.id), cartId],
    queryFn: async () => {
      const result = await fetchWorkerStats(selectedMonth, workers, cartId);
      return result.analytics;
    },
    enabled: workers.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
