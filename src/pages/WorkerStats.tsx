import { useState, useEffect } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import WorkerStatsHeader from "../components/workerstats/WorkerStatsHeader";
import MobileWorkerCard from "../components/workerstats/MobileWorkerCard";
import DesktopWorkerTable from "../components/workerstats/DesktopWorkerTable";
import type { Order } from "../types/order";

type DateKey = string; // Format: YYYY-MM-DD
type WorkerStats = {
  [workerId: string]: {
    name: string;
    ordersByDate: {
      [date: DateKey]: number;
    };
    totalOrders: number;
  };
};

export default function WorkerStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WorkerStats>({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [workers, setWorkers] = useState<{ id: string; email: string; workerName: string; uid: string }[]>([]);

  // Get days in the selected month
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): DateKey => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Load workers
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const workersRef = collection(db, "workers");
        const snapshot = await getDocs(workersRef);
        const workersData: { id: string; email: string; workerName: string; uid: string }[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          workersData.push({
            id: doc.id,
            email: data.email || "Unknown",
            workerName: data.workerName || "Unknown",
            uid: data.uid || "Unknown",
          });
        });
        
        setWorkers(workersData);
      } catch (error) {
        console.error("Error loading workers:", error);
      }
    };
    
    loadWorkers();
  }, []);

  // Load stats for the selected month
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [year, month] = selectedMonth.split("-").map(Number);
        
        // Start and end of the selected month
        const startDate = new Date(year, month - 1, 1, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const ordersRef = collection(db, "orders");
        const q = query(
          ordersRef,
          where("status", "==", "completed"),
          where("completedAt", ">=", Timestamp.fromDate(startDate)),
          where("completedAt", "<=", Timestamp.fromDate(endDate))
        );
        
        const snapshot = await getDocs(q);
        
        // Initialize stats object
        const newStats: WorkerStats = {};
        
        // Process orders
        snapshot.forEach(doc => {
          const order = doc.data() as Order;
          if (!order.completedBy) return;
          
          const workerId = order.completedBy;
          const orderDate = order.completedAt ? formatDate(
  order.completedAt instanceof Date 
    ? order.completedAt 
    : (order.completedAt as Timestamp).toDate()
) : "";
          
          if (!orderDate) return;
          
          // Initialize worker stats if not exists
          if (!newStats[workerId]) {
            console.log("workers array:", workers);
            console.log("looking for workerId:", workerId);
            
            const worker = workers.find(w => w.id === workerId || w.uid === workerId);
            console.log("found worker:", worker);
            
            newStats[workerId] = {
              name: worker?.workerName || `Worker ${workerId}`,
              ordersByDate: {},
              totalOrders: 0
            };
          }
          
          // Increment order count for this date
          if (!newStats[workerId].ordersByDate[orderDate]) {
            newStats[workerId].ordersByDate[orderDate] = 0;
          }
          newStats[workerId].ordersByDate[orderDate]++;
          newStats[workerId].totalOrders++;
        });
        
        setStats(newStats);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (workers.length > 0) {
      loadStats();
    }
  }, [selectedMonth, workers]);

  // Generate calendar days
  const calendarDays = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <WorkerStatsHeader 
          selectedMonth={selectedMonth} 
          onMonthChange={setSelectedMonth} 
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {Object.entries(stats).map(([workerId, workerData]) => (
                <MobileWorkerCard 
                  key={workerId}
                  workerId={workerId}
                  workerData={workerData}
                  selectedMonth={selectedMonth}
                  calendarDays={calendarDays}
                />
              ))}
              {Object.keys(stats).length === 0 && (
                <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-500">
                  No data available for this month
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <DesktopWorkerTable 
              stats={stats}
              selectedMonth={selectedMonth}
              calendarDays={calendarDays}
            />
          </>
        )}
      </div>
    </div>
  );
}
