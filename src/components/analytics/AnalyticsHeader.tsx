import { useNavigate } from "react-router-dom";

interface AnalyticsHeaderProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export default function AnalyticsHeader({ selectedPeriod, onPeriodChange }: AnalyticsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Business Analytics</h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4">
        <button 
          onClick={() => navigate("/dashboard")}
          className="px-3 py-2 sm:px-4 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 text-sm sm:text-base flex items-center justify-center space-x-1 sm:space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </button>
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm sm:text-base"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>
    </div>
  );
}
