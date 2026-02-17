import { useMemo } from "react";
import type { Order } from "../../types/order";

interface OrderMetricsProps {
  orders: Order[];
}

export default function OrderMetrics({ orders }: OrderMetricsProps) {
  const metrics = useMemo(() => {
    // Total orders
    const totalOrders = orders.length;
    
    // Orders by status
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const readyOrders = orders.filter(order => order.status === 'ready').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    // Calculate completion rate
    const completionRate = totalOrders > 0 
      ? Math.round((completedOrders / totalOrders) * 100) 
      : 0;
    
    // Calculate average time to ready (in minutes)
    const ordersWithReadyTime = orders.filter(order => order.readyAt && order.createdAt);
    const avgTimeToReady = ordersWithReadyTime.length > 0
      ? Math.round(
          ordersWithReadyTime.reduce((sum, order) => {
            const createdTime = order.createdAt.getTime();
            const readyTime = order.readyAt!.getTime();
            return sum + (readyTime - createdTime) / (1000 * 60); // Convert ms to minutes
          }, 0) / ordersWithReadyTime.length
        )
      : 0;
    
    // Calculate average time to completion (in minutes)
    const ordersWithCompletionTime = orders.filter(order => order.completedAt && order.createdAt);
    const avgTimeToCompletion = ordersWithCompletionTime.length > 0
      ? Math.round(
          ordersWithCompletionTime.reduce((sum, order) => {
            const createdTime = order.createdAt.getTime();
            const completedTime = order.completedAt!.getTime();
            return sum + (completedTime - createdTime) / (1000 * 60); // Convert ms to minutes
          }, 0) / ordersWithCompletionTime.length
        )
      : 0;
    
    return {
      totalOrders,
      pendingOrders,
      readyOrders,
      completedOrders,
      completionRate,
      avgTimeToReady,
      avgTimeToCompletion
    };
  }, [orders]);

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Order Metrics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Orders</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-800">{metrics.totalOrders}</p>
        </div>
        
        {/* Completion Rate */}
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-green-600 font-medium">Completion Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-green-800">{metrics.completionRate}%</p>
        </div>
        
        {/* Avg Time to Ready */}
        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-600 font-medium">Avg Time to Ready</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-800">{metrics.avgTimeToReady} min</p>
        </div>
        
        {/* Avg Time to Completion */}
        <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-purple-600 font-medium">Avg Time to Complete</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-800">{metrics.avgTimeToCompletion} min</p>
        </div>
      </div>
      
      {/* Status Breakdown */}
      <div className="mt-4 sm:mt-6">
        <h3 className="text-sm sm:text-md font-medium text-gray-700 mb-2 sm:mb-3">Order Status</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="flex h-full rounded-full overflow-hidden">
            <div 
              className="bg-yellow-400" 
              style={{ width: `${metrics.totalOrders > 0 ? (metrics.pendingOrders / metrics.totalOrders) * 100 : 0}%` }}
              title={`Pending: ${metrics.pendingOrders}`}
            ></div>
            <div 
              className="bg-blue-400" 
              style={{ width: `${metrics.totalOrders > 0 ? (metrics.readyOrders / metrics.totalOrders) * 100 : 0}%` }}
              title={`Ready: ${metrics.readyOrders}`}
            ></div>
            <div 
              className="bg-green-400" 
              style={{ width: `${metrics.totalOrders > 0 ? (metrics.completedOrders / metrics.totalOrders) * 100 : 0}%` }}
              title={`Completed: ${metrics.completedOrders}`}
            ></div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between mt-2 text-xs text-gray-600 space-y-1 sm:space-y-0">
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full mr-1"></div>
            <span>Pending ({metrics.pendingOrders})</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full mr-1"></div>
            <span>Ready ({metrics.readyOrders})</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full mr-1"></div>
            <span>Completed ({metrics.completedOrders})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
