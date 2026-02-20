interface OrderMetricsOptimizedProps {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    readyOrders: number;
    completedOrders: number;
    avgTimeToReady: number;
    avgTimeToCompletion: number;
    completionRate: number;
  };
}

export default function OrderMetricsOptimized({ metrics }: OrderMetricsOptimizedProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Order Metrics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-400 font-medium">Total Orders</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-300">{metrics.totalOrders}</p>
        </div>
        
        {/* Completion Rate */}
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-green-400 font-medium">Completion Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">{metrics.completionRate}%</p>
        </div>
        
        {/* Avg Time to Ready */}
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-400 font-medium">Avg Time to Ready</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-300">{metrics.avgTimeToReady} min</p>
        </div>
        
        {/* Avg Time to Completion */}
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-purple-400 font-medium">Avg Time to Complete</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-300">{metrics.avgTimeToCompletion} min</p>
        </div>
      </div>
      
      {/* Status Breakdown */}
      <div className="mt-4 sm:mt-6">
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">Order Status</h3>
        <div className="w-full bg-zinc-700 rounded-full h-4">
          <div className="flex h-full rounded-full overflow-hidden">
            <div 
              className="bg-yellow-500" 
              style={{ width: `${metrics.totalOrders > 0 ? (metrics.pendingOrders / metrics.totalOrders) * 100 : 0}%` }}
              title={`Pending: ${metrics.pendingOrders}`}
            ></div>
            <div 
              className="bg-blue-500" 
              style={{ width: `${metrics.totalOrders > 0 ? (metrics.readyOrders / metrics.totalOrders) * 100 : 0}%` }}
              title={`Ready: ${metrics.readyOrders}`}
            ></div>
            <div 
              className="bg-green-500" 
              style={{ width: `${metrics.totalOrders > 0 ? (metrics.completedOrders / metrics.totalOrders) * 100 : 0}%` }}
              title={`Completed: ${metrics.completedOrders}`}
            ></div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between mt-2 text-xs text-zinc-400 space-y-1 sm:space-y-0">
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span>Pending ({metrics.pendingOrders})</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Ready ({metrics.readyOrders})</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Completed ({metrics.completedOrders})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
