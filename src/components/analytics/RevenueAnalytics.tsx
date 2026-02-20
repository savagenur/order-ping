import { useMemo } from "react";
import type { Order } from "../../types/order";

interface RevenueAnalyticsProps {
  orders: Order[];
}

export default function RevenueAnalytics({ orders }: RevenueAnalyticsProps) {
  const revenueData = useMemo(() => {
    if (orders.length === 0) {
      return {
        totalRevenue: 0,
        avgOrderValue: 0,
        dailyRevenue: [],
        topItems: [],
        revenueByStatus: { pending: 0, ready: 0, completed: 0 },
        revenueGrowth: 0
      };
    }

    // Calculate revenue from orders
    const ordersWithRevenue = orders.map(order => {
      // TODO: Calculate actual revenue when orderDetails is structured data
      const orderTotal = 0; // Placeholder until orderDetails is properly structured

      return {
        ...order,
        revenue: orderTotal,
        itemCount: 0 // TODO: Get actual item count when orderDetails is structured
      };
    });

    const totalRevenue = ordersWithRevenue.reduce((sum, order) => sum + order.revenue, 0);
    const avgOrderValue = ordersWithRevenue.length > 0 ? totalRevenue / ordersWithRevenue.length : 0;

    // Daily revenue breakdown
    const dailyRevenueMap = ordersWithRevenue.reduce((acc, order) => {
      const date = order.createdAt instanceof Date ? order.createdAt : order.createdAt.toDate();
      const dateKey = date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, revenue: 0, orderCount: 0, avgOrderValue: 0 };
      }
      acc[dateKey].revenue += order.revenue;
      acc[dateKey].orderCount += 1;
      return acc;
    }, {} as Record<string, { date: string; revenue: number; orderCount: number; avgOrderValue: number }>);

    const dailyRevenue = Object.values(dailyRevenueMap)
      .map(day => ({
        ...day,
        avgOrderValue: day.orderCount > 0 ? day.revenue / day.orderCount : 0,
        date: new Date(day.date).toLocaleDateString()
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    // Top selling items
    // TODO: Implement when orderDetails is structured data
    const topItems: Array<{ name: string; quantity: number; revenue: number; price: number }> = [];

    // Revenue by status
    const revenueByStatus = ordersWithRevenue.reduce((acc, order) => {
      acc[order.status as keyof typeof acc] += order.revenue;
      return acc;
    }, { pending: 0, ready: 0, completed: 0 });

    // Revenue growth (compare last 3 days with previous 3 days)
    const sortedDailyRevenue = Object.values(dailyRevenueMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let revenueGrowth = 0;
    if (sortedDailyRevenue.length >= 6) {
      const recent = sortedDailyRevenue.slice(-3).reduce((sum, day) => sum + day.revenue, 0);
      const previous = sortedDailyRevenue.slice(-6, -3).reduce((sum, day) => sum + day.revenue, 0);
      revenueGrowth = previous > 0 ? Math.round(((recent - previous) / previous) * 100) : 0;
    }

    return {
      totalRevenue,
      avgOrderValue,
      dailyRevenue,
      topItems,
      revenueByStatus,
      revenueGrowth
    };
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-400';
    if (growth < 0) return 'text-red-400';
    return 'text-zinc-400';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '→';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Revenue Analytics</h2>
      
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-green-400 font-medium">Total Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">
            {formatCurrency(revenueData.totalRevenue)}
          </p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-400 font-medium">Avg Order Value</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-300">
            {formatCurrency(revenueData.avgOrderValue)}
          </p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-purple-400 font-medium">Revenue Growth</p>
          <p className={`text-xl sm:text-2xl font-bold ${getGrowthColor(revenueData.revenueGrowth)}`}>
            {getGrowthIcon(revenueData.revenueGrowth)} {revenueData.revenueGrowth}%
          </p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-amber-400 font-medium">Completed Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-300">
            {formatCurrency(revenueData.revenueByStatus.completed)}
          </p>
        </div>
      </div>

      {/* Daily Revenue Table */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">Daily Revenue (Last 7 Days)</h3>
        <div className="overflow-x-auto">
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
                  Revenue
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Avg Order
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-700">
              {revenueData.dailyRevenue.length > 0 ? (
                revenueData.dailyRevenue.map((day, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800'}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                      {day.date}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                      {day.orderCount}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-zinc-300">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                      {formatCurrency(day.avgOrderValue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-zinc-500">
                    No revenue data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">Top Selling Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-700">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Sold
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-700">
              {revenueData.topItems.length > 0 ? (
                revenueData.topItems.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800'}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-zinc-300">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-zinc-300">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-zinc-500">
                    No item sales data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Status */}
      <div>
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">Revenue by Order Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-800 border border-yellow-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-400">Pending</p>
                <p className="text-lg font-bold text-yellow-300">
                  {formatCurrency(revenueData.revenueByStatus.pending)}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-300">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-400">Ready</p>
                <p className="text-lg font-bold text-blue-300">
                  {formatCurrency(revenueData.revenueByStatus.ready)}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-300">
                  {orders.filter(o => o.status === 'ready').length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800 border border-green-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-400">Completed</p>
                <p className="text-lg font-bold text-green-300">
                  {formatCurrency(revenueData.revenueByStatus.completed)}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-green-300">
                  {orders.filter(o => o.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
