import type { TeamAnalytics } from '../../hooks/useWorkerStatsQuery';

interface WorkerStatsSummaryProps {
  analytics: TeamAnalytics;
  isLoading: boolean;
}

export default function WorkerStatsSummary({ analytics, isLoading }: WorkerStatsSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-zinc-700 rounded mb-2"></div>
            <div className="h-6 bg-zinc-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {/* Total Orders */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm font-medium">Total Orders</span>
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white">{analytics.totalOrders.toLocaleString()}</div>
        <div className="text-xs text-zinc-500 mt-1">This month</div>
      </div>

      {/* Active Workers */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm font-medium">Active Workers</span>
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white">{analytics.totalWorkers}</div>
        <div className="text-xs text-zinc-500 mt-1">Team members</div>
      </div>

      {/* Average per Worker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm font-medium">Avg per Worker</span>
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white">{analytics.averageOrdersPerWorker.toFixed(1)}</div>
        <div className="text-xs text-zinc-500 mt-1">Orders per worker</div>
      </div>

      {/* Average Completion Time */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm font-medium">Avg Time</span>
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white">
          {analytics.averageCompletionTime > 0 ? (
            analytics.averageCompletionTime < 60 
              ? `${analytics.averageCompletionTime.toFixed(1)}m`
              : `${(analytics.averageCompletionTime / 60).toFixed(1)}h`
          ) : 'N/A'}
        </div>
        <div className="text-xs text-zinc-500 mt-1">Per order</div>
      </div>

      {/* Peak Hour */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm font-medium">Peak Hour</span>
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white">
          {analytics.peakHour.hour ? `${analytics.peakHour.hour}:00` : 'N/A'}
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          {analytics.peakHour.count > 0 ? `${analytics.peakHour.count} orders` : 'No data'}
        </div>
      </div>

      {/* Team Efficiency */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm font-medium">Efficiency</span>
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white">{formatPercentage(analytics.teamEfficiency)}</div>
        <div className="text-xs text-zinc-500 mt-1">Utilization rate</div>
      </div>
    </div>
  );
}
