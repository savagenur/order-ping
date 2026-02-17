import CalendarDayCell from "./CalendarDayCell";

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

interface DesktopWorkerTableProps {
  stats: WorkerStats;
  selectedMonth: string;
  calendarDays: number[];
}

export default function DesktopWorkerTable({ stats, selectedMonth, calendarDays }: DesktopWorkerTableProps) {
  return (
    <div className="hidden sm:block bg-white shadow rounded-lg">
      <div className="overflow-x-auto">
        <div className="w-[90vw] min-w-[90vw]">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20">
                  Worker
                </th>
                {calendarDays.map(day => (
                  <th key={day} className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-10 sm:min-w-10 xl:min-w-10">
                    {day}
                  </th>
                ))}
                <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(stats).map(([workerId, workerData]) => {
                const [year, month] = selectedMonth.split("-").map(Number);
                
                return (
                  <tr key={workerId}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                      <span className="truncate block max-w-32 sm:max-w-none">{workerData.name}</span>
                    </td>
                    {calendarDays.map(day => {
                      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const count = workerData.ordersByDate[dateKey] || 0;
                      
                      return (
                        <td key={day}>
                          <CalendarDayCell 
                            day={day} 
                            count={count} 
                            isMobile={false}
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium sticky right-0 bg-white z-10">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                        {workerData.totalOrders}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {Object.keys(stats).length === 0 && (
                <tr>
                  <td colSpan={calendarDays.length + 2} className="px-6 py-8 text-center text-sm text-gray-500">
                    No data available for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
