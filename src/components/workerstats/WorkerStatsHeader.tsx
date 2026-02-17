import { useNavigate } from "react-router-dom";

interface WorkerStatsHeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export default function WorkerStatsHeader({ selectedMonth, onMonthChange }: WorkerStatsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Worker Performance</h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <button 
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm sm:text-base flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm sm:text-base"
        />
      </div>
    </div>
  );
}
