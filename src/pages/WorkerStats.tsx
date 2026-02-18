import { useState } from "react";
import { useWorkersQuery, useWorkerStatsQuery } from "../hooks/useWorkerStatsQuery";
import WorkerStatsHeader from "../components/workerstats/WorkerStatsHeader";
import MobileWorkerCard from "../components/workerstats/MobileWorkerCard";
import DesktopWorkerTable from "../components/workerstats/DesktopWorkerTable";

export default function WorkerStats() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // TanStack Query - workers list (cached 10 min)
  const { data: workers = [] } = useWorkersQuery();

  // TanStack Query - worker stats for selected month (cached 5 min)
  const { data: stats = {}, isLoading } = useWorkerStatsQuery(selectedMonth, workers);

  // Get days in the selected month
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  };

  // Generate calendar days
  const calendarDays = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);
  
  return (
    <div className="min-h-screen w-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <WorkerStatsHeader 
          selectedMonth={selectedMonth} 
          onMonthChange={setSelectedMonth} 
        />

        {isLoading ? (
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
