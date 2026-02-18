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
  };
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

async function fetchWorkers(): Promise<WorkerDoc[]> {
  const workersRef = collection(db, 'workers');
  const snapshot = await getDocs(workersRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    email: doc.data().email || 'Unknown',
    workerName: doc.data().workerName || 'Unknown',
    uid: doc.data().uid || 'Unknown',
  }));
}

async function fetchWorkerStats(
  selectedMonth: string,
  workers: WorkerDoc[],
): Promise<WorkerStatsMap> {
  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('status', '==', 'completed'),
    where('completedAt', '>=', Timestamp.fromDate(startDate)),
    where('completedAt', '<=', Timestamp.fromDate(endDate)),
  );

  const snapshot = await getDocs(q);
  const newStats: WorkerStatsMap = {};

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

    if (!newStats[workerId]) {
      const worker = workers.find((w) => w.id === workerId || w.uid === workerId);
      newStats[workerId] = {
        name: worker?.workerName || `Worker ${workerId}`,
        ordersByDate: {},
        totalOrders: 0,
      };
    }

    if (!newStats[workerId].ordersByDate[orderDate]) {
      newStats[workerId].ordersByDate[orderDate] = 0;
    }
    newStats[workerId].ordersByDate[orderDate]++;
    newStats[workerId].totalOrders++;
  });

  return newStats;
}

export function useWorkersQuery() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: fetchWorkers,
    staleTime: 1000 * 60 * 10, // 10 min - workers don't change often
  });
}

export function useWorkerStatsQuery(selectedMonth: string, workers: WorkerDoc[]) {
  return useQuery({
    queryKey: ['worker-stats', selectedMonth, workers.map((w) => w.id)],
    queryFn: () => fetchWorkerStats(selectedMonth, workers),
    enabled: workers.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
