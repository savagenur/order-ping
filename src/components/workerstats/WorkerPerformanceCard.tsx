import type { WorkerStatsMap } from '../../hooks/useWorkerStatsQuery';

type WorkerData = WorkerStatsMap[string];

interface WorkerPerformanceCardProps {
  workerData: WorkerData;
}

export default function WorkerPerformanceCard({ workerData }: WorkerPerformanceCardProps) {
  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'decreasing':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return 'text-green-400';
      case 'decreasing': return 'text-red-400';
      case 'stable': return 'text-yellow-400';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
      {/* Worker Name and Trend */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-white truncate">{workerData.name}</h3>
        <div className="flex items-center space-x-2">
          {getTrendIcon(workerData.productivityTrend)}
          <span className={`text-xs font-medium ${getTrendColor(workerData.productivityTrend)}`}>
            {workerData.productivityTrend}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-zinc-400 text-xs mb-1">Total Orders</div>
          <div className="text-lg font-bold text-white">{workerData.totalOrders}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs mb-1">Daily Average</div>
          <div className="text-lg font-bold text-blue-400">{workerData.averageOrdersPerDay.toFixed(1)}</div>
        </div>
      </div>

      {/* Time-based Analytics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-zinc-400 text-xs mb-1">Peak Hour</div>
          <div className="text-sm">
            {workerData.peakHour.hour ? (
              <>
                <div className="font-medium text-purple-400">{workerData.peakHour.hour}:00</div>
                <div className="text-xs text-zinc-500">{workerData.peakHour.count} orders</div>
              </>
            ) : (
              <div className="text-zinc-600 text-xs">No data</div>
            )}
          </div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs mb-1">Avg Completion</div>
          <div className="text-sm">
            {workerData.averageCompletionTime > 0 ? (
              <div className="font-medium text-orange-400">
                {workerData.averageCompletionTime < 60 
                  ? `${workerData.averageCompletionTime.toFixed(1)} min`
                  : `${(workerData.averageCompletionTime / 60).toFixed(1)} hr`
                }
              </div>
            ) : (
              <div className="text-zinc-600 text-xs">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Best and Worst Days */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-zinc-400 text-xs mb-1">Best Day</div>
          <div className="text-sm">
            {workerData.bestDay.date ? (
              <>
                <div className="font-medium text-green-400">{workerData.bestDay.count} orders</div>
                <div className="text-xs text-zinc-500">{workerData.bestDay.date}</div>
              </>
            ) : (
              <div className="text-zinc-600 text-xs">No data</div>
            )}
          </div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs mb-1">Worst Day</div>
          <div className="text-sm">
            {workerData.worstDay.date ? (
              <>
                <div className="font-medium text-red-400">{workerData.worstDay.count} orders</div>
                <div className="text-xs text-zinc-500">{workerData.worstDay.date}</div>
              </>
            ) : (
              <div className="text-zinc-600 text-xs">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="pt-2 border-t border-zinc-800">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-400">Active Days: </span>
            <span className="text-white font-medium">{workerData.activeDays}</span>
          </div>
          <div>
            <span className="text-zinc-400">Fastest: </span>
            <span className="text-green-400 font-medium">
              {workerData.fastestCompletion.time > 0 
                ? workerData.fastestCompletion.time < 60 
                  ? `${workerData.fastestCompletion.time.toFixed(0)}m`
                  : `${(workerData.fastestCompletion.time / 60).toFixed(1)}h`
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
