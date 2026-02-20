import { useState } from "react";
import { useWorkersQuery, useWorkerStatsQuery, useTeamAnalyticsQuery } from "../hooks/useWorkerStatsQuery";
import { useAuthStore } from "../stores/authStore";
import WorkerStatsHeader from "../components/workerstats/WorkerStatsHeader";
import WorkerStatsSummary from "../components/workerstats/WorkerStatsSummary";
import WorkerPerformanceCard from "../components/workerstats/WorkerPerformanceCard";
import HourlyChart from "../components/workerstats/HourlyChart";
import MobileWorkerCard from "../components/workerstats/MobileWorkerCard";
import DesktopWorkerTable from "../components/workerstats/DesktopWorkerTable";

export default function WorkerStats() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { cartId, isSuperAdmin } = useAuthStore();

  // TanStack Query - workers list filtered by cart (cached 10 min)
  const { data: workers = [] } = useWorkersQuery(isSuperAdmin ? undefined : (cartId || undefined));

  // TanStack Query - worker stats for selected month (cached 5 min)
  const { data: result = { stats: {}, analytics: {
    totalOrders: 0,
    totalWorkers: 0,
    averageOrdersPerWorker: 0,
    averageOrdersPerDay: 0,
    mostProductiveWorker: { id: '', name: '', count: 0 },
    leastProductiveWorker: { id: '', name: '', count: 0 },
    peakDay: { date: '', count: 0 },
    teamEfficiency: 0,
    peakHour: { hour: '', count: 0 },
    averageCompletionTime: 0,
    hourlyDistribution: {}
  } }, isLoading } = useWorkerStatsQuery(selectedMonth, workers, isSuperAdmin ? undefined : (cartId || undefined));
  
  const { data: analytics } = useTeamAnalyticsQuery(selectedMonth, workers, isSuperAdmin ? undefined : (cartId || undefined));

  // Get days in the selected month
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  };

  // Generate calendar days
  const calendarDays = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);
  
  return (
    <div className="min-h-screen w-screen bg-zinc-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <WorkerStatsHeader 
          selectedMonth={selectedMonth} 
          onMonthChange={setSelectedMonth} 
        />

        <WorkerStatsSummary analytics={analytics || result.analytics} isLoading={isLoading} />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-zinc-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {/* Performance Cards */}
              <div className="space-y-4">
                {Object.entries(result.stats).map(([workerId, workerData]) => (
                  <WorkerPerformanceCard 
                    key={workerId}
                    workerData={workerData}
                  />
                ))}
              </div>
              
              {/* Hourly Chart */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Team Activity Patterns</h3>
                <HourlyChart 
                  hourlyDistribution={analytics?.hourlyDistribution || {}}
                  peakHour={analytics?.peakHour || { hour: '', count: 0 }}
                />
              </div>
              
              {/* Calendar View */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Daily Calendar View</h3>
                {Object.entries(result.stats).map(([workerId, workerData]) => (
                  <MobileWorkerCard 
                    key={workerId}
                    workerId={workerId}
                    workerData={workerData}
                    selectedMonth={selectedMonth}
                    calendarDays={calendarDays}
                  />
                ))}
              </div>
              
              {Object.keys(result.stats).length === 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-sm text-zinc-500">
                  No data available for this month
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="hidden sm:block">
                <h3 className="text-lg font-semibold text-white mb-4">Worker Performance Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Object.entries(result.stats).map(([workerId, workerData]) => (
                    <WorkerPerformanceCard 
                      key={workerId}
                      workerData={workerData}
                    />
                  ))}
                </div>
              </div>
              
              {/* Hourly Distribution Chart */}
              <div className="hidden sm:block">
                <h3 className="text-lg font-semibold text-white mb-4">Team Activity Patterns</h3>
                <HourlyChart 
                  hourlyDistribution={analytics?.hourlyDistribution || {}}
                  peakHour={analytics?.peakHour || { hour: '', count: 0 }}
                />
              </div>
              
              {/* Calendar Table */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 sm:block hidden">Daily Calendar View</h3>
                <DesktopWorkerTable 
                  stats={result.stats}
                  selectedMonth={selectedMonth}
                  calendarDays={calendarDays}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
