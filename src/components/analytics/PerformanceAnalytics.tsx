import { useMemo } from "react";
import type { Order } from "../../types/order";
import { getTime, toISOString } from "../../utils/dateUtils";

interface PerformanceAnalyticsProps {
  orders: Order[];
}

export default function PerformanceAnalytics({ orders }: PerformanceAnalyticsProps) {
  const performanceData = useMemo(() => {
    if (orders.length === 0) {
      return {
        avgPrepTime: 0,
        avgWaitTime: 0,
        fastestOrder: null,
        slowestOrder: null,
        dailyPerformance: [],
        hourlyPerformance: [],
        efficiencyScore: 0
      };
    }

    // Calculate preparation times (readyAt - createdAt)
    const prepTimes = orders
      .filter(order => order.readyAt && order.createdAt)
      .map(order => ({
        orderNumber: order.orderNumber,
        prepTime: (getTime(order.readyAt!) - getTime(order.createdAt)) / (1000 * 60), // minutes
        customerName: order.customerName,
        createdAt: order.createdAt
      }));

    // Calculate total wait times (completedAt - createdAt)
    const waitTimes = orders
      .filter(order => order.completedAt && order.createdAt)
      .map(order => ({
        orderNumber: order.orderNumber,
        waitTime: (getTime(order.completedAt!) - getTime(order.createdAt)) / (1000 * 60), // minutes
        customerName: order.customerName,
        createdAt: order.createdAt
      }));

    const avgPrepTime = prepTimes.length > 0 
      ? Math.round(prepTimes.reduce((sum, order) => sum + order.prepTime, 0) / prepTimes.length)
      : 0;

    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((sum, order) => sum + order.waitTime, 0) / waitTimes.length)
      : 0;

    // Find fastest and slowest orders
    const fastestOrder = prepTimes.length > 0 
      ? prepTimes.reduce((min, order) => order.prepTime < min.prepTime ? order : min)
      : null;

    const slowestOrder = prepTimes.length > 0
      ? prepTimes.reduce((max, order) => order.prepTime > max.prepTime ? order : max)
      : null;

    // Daily performance (avg prep time by day)
    const dailyPerformance = prepTimes.reduce((acc, order) => {
      const dateKey = toISOString(order.createdAt).split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalPrepTime: 0, orderCount: 0 };
      }
      acc[dateKey].totalPrepTime += order.prepTime;
      acc[dateKey].orderCount += 1;
      return acc;
    }, {} as Record<string, { date: string; totalPrepTime: number; orderCount: number }>);

    const dailyPerformanceArray = Object.values(dailyPerformance)
      .map(day => ({
        date: new Date(day.date).toLocaleDateString(),
        avgPrepTime: Math.round(day.totalPrepTime / day.orderCount),
        orderCount: day.orderCount
      }))
      .slice(-7); // Last 7 days

    // Hourly performance (avg prep time by hour)
    const hourlyPerformance = prepTimes.reduce((acc, order) => {
      const hour = new Date(getTime(order.createdAt)).getHours();
      if (!acc[hour]) {
        acc[hour] = { hour, totalPrepTime: 0, orderCount: 0 };
      }
      acc[hour].totalPrepTime += order.prepTime;
      acc[hour].orderCount += 1;
      return acc;
    }, {} as Record<number, { hour: number; totalPrepTime: number; orderCount: number }>);

    const hourlyPerformanceArray = Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyPerformance[hour];
      return {
        hour: `${hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}`,
        avgPrepTime: data ? Math.round(data.totalPrepTime / data.orderCount) : 0,
        orderCount: data?.orderCount || 0
      };
    });

    // Efficiency score (based on how many orders are completed within target time)
    const targetPrepTime = 15; // 15 minutes target
    const efficientOrders = prepTimes.filter(order => order.prepTime <= targetPrepTime).length;
    const efficiencyScore = prepTimes.length > 0 
      ? Math.round((efficientOrders / prepTimes.length) * 100)
      : 0;

    return {
      avgPrepTime,
      avgWaitTime,
      fastestOrder,
      slowestOrder,
      dailyPerformance: dailyPerformanceArray,
      hourlyPerformance: hourlyPerformanceArray,
      efficiencyScore
    };
  }, [orders]);

  const formatTime = (minutes: number) => {
    const roundedMinutes = Math.round(minutes * 100) / 100;
    if (roundedMinutes < 60) return `${roundedMinutes} min`;
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Performance Analytics</h2>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-green-400 font-medium">Avg Prep Time</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">{formatTime(performanceData.avgPrepTime)}</p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-400 font-medium">Avg Wait Time</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-300">{formatTime(performanceData.avgWaitTime)}</p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-400 font-medium">Efficiency Score</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-300">{performanceData.efficiencyScore}%</p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-purple-400 font-medium">Total Analyzed</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-300">
            {orders.filter(o => o.readyAt && o.createdAt).length}
          </p>
        </div>
      </div>

      {/* Performance Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Fastest Order */}
        <div className="bg-zinc-800 border border-emerald-700 rounded-lg p-3 sm:p-4">
          <h3 className="text-sm font-medium text-emerald-300 mb-2">🏆 Fastest Order</h3>
          {performanceData.fastestOrder ? (
            <div>
              <p className="text-lg font-bold text-emerald-200">
                Order #{performanceData.fastestOrder.orderNumber}
              </p>
              <p className="text-sm text-emerald-400">
                {performanceData.fastestOrder.customerName}
              </p>
              <p className="text-sm font-medium text-emerald-300">
                Ready in {formatTime(performanceData.fastestOrder.prepTime)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-emerald-400">No data available</p>
          )}
        </div>

        {/* Slowest Order */}
        <div className="bg-zinc-800 border border-red-700 rounded-lg p-3 sm:p-4">
          <h3 className="text-sm font-medium text-red-300 mb-2">⚠️ Slowest Order</h3>
          {performanceData.slowestOrder ? (
            <div>
              <p className="text-lg font-bold text-red-200">
                Order #{performanceData.slowestOrder.orderNumber}
              </p>
              <p className="text-sm text-red-400">
                {performanceData.slowestOrder.customerName}
              </p>
              <p className="text-sm font-medium text-red-300">
                Ready in {formatTime(performanceData.slowestOrder.prepTime)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-400">No data available</p>
          )}
        </div>
      </div>

      {/* Daily Performance */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">Daily Performance (Last 7 Days)</h3>

        {/* Mobile Card Layout */}
        <div className="sm:hidden space-y-2">
          {performanceData.dailyPerformance.length > 0 ? (
            performanceData.dailyPerformance.map((day, index) => {
              const performanceLevel = day.avgPrepTime <= 10 ? 'excellent' : 
                                     day.avgPrepTime <= 15 ? 'good' : 
                                     day.avgPrepTime <= 20 ? 'average' : 'poor';
              const performanceColors = {
                excellent: 'bg-green-900 text-green-300',
                good: 'bg-blue-900 text-blue-300',
                average: 'bg-yellow-900 text-yellow-300',
                poor: 'bg-red-900 text-red-300'
              };

              return (
                <div key={index} className="border border-zinc-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-300">{day.date}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${performanceColors[performanceLevel]}`}>
                      {performanceLevel.charAt(0).toUpperCase() + performanceLevel.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{day.orderCount} orders</span>
                    <span>Avg: {formatTime(day.avgPrepTime)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center py-4 text-sm text-zinc-500">
              No performance data available for the last 7 days
            </p>
          )}
        </div>

        {/* Tablet / Desktop Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-700">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Avg Prep Time
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-700">
              {performanceData.dailyPerformance.length > 0 ? (
                performanceData.dailyPerformance.map((day, index) => {
                  const performanceLevel = day.avgPrepTime <= 10 ? 'excellent' : 
                                         day.avgPrepTime <= 15 ? 'good' : 
                                         day.avgPrepTime <= 20 ? 'average' : 'poor';
                  const performanceColors = {
                    excellent: 'bg-green-900 text-green-300',
                    good: 'bg-blue-900 text-blue-300',
                    average: 'bg-yellow-900 text-yellow-300',
                    poor: 'bg-red-900 text-red-300'
                  };

                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                        {day.date}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                        {day.orderCount}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                        {formatTime(day.avgPrepTime)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${performanceColors[performanceLevel]}`}>
                          {performanceLevel.charAt(0).toUpperCase() + performanceLevel.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-zinc-500">
                    No performance data available for the last 7 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-zinc-800 rounded-lg p-3 sm:p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Performance Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span className="text-zinc-400">
              {performanceData.efficiencyScore >= 80 ? 'Excellent efficiency!' : 
               performanceData.efficiencyScore >= 60 ? 'Good efficiency level.' : 
               'Room for improvement in efficiency.'}
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">ℹ</span>
            <span className="text-zinc-400">
              Target prep time: 15 minutes or less
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
