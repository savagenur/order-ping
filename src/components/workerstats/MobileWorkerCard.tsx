import CalendarDayCell from "./CalendarDayCell";

type DateKey = string; // Format: YYYY-MM-DD
type WorkerData = {
  name: string;
  ordersByDate: {
    [date: DateKey]: number;
  };
  totalOrders: number;
};

interface MobileWorkerCardProps {
  workerId: string;
  workerData: WorkerData;
  selectedMonth: string;
  calendarDays: number[];
}

export default function MobileWorkerCard({ workerId, workerData, selectedMonth, calendarDays }: MobileWorkerCardProps) {
  return (
    <div key={workerId} className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 truncate">{workerData.name}</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {workerData.totalOrders}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {calendarDays.map(day => {
          const [year, month] = selectedMonth.split("-").map(Number);
          const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = workerData.ordersByDate[dateKey] || 0;
          
          return (
            <CalendarDayCell 
              key={day} 
              day={day} 
              count={count} 
              isMobile={true}
            />
          );
        })}
      </div>
    </div>
  );
}
