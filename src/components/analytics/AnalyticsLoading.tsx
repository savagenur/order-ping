export default function AnalyticsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center items-center h-32">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-sm text-zinc-400">Loading analytics data...</div>
          <div className="text-xs text-zinc-500">This may take a moment for larger date ranges</div>
        </div>
      </div>
      
      {/* Skeleton placeholders for metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-zinc-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      
      {/* Skeleton placeholder for order details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
        <div className="h-6 bg-zinc-700 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
