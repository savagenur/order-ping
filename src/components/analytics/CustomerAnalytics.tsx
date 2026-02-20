import { useMemo } from "react";
import type { Order } from "../../types/order";
import { getTime } from "../../utils/dateUtils";

interface CustomerAnalyticsProps {
  orders: Order[];
}

export default function CustomerAnalytics({ orders }: CustomerAnalyticsProps) {
  const customerStats = useMemo(() => {
    if (orders.length === 0) {
      return {
        uniqueCustomers: 0,
        repeatCustomers: 0,
        avgOrdersPerCustomer: 0,
        topCustomers: [],
        customerOrderFrequency: {}
      };
    }

    // Group orders by customer
    const customerOrders = new Map<string, Order[]>();
    orders.forEach(order => {
      const key = order.phoneNumber; // Use phone number as unique identifier
      if (!customerOrders.has(key)) {
        customerOrders.set(key, []);
      }
      customerOrders.get(key)!.push(order);
    });

    const uniqueCustomers = customerOrders.size;
    const repeatCustomers = Array.from(customerOrders.values()).filter(customerOrderList => customerOrderList.length > 1).length;
    const avgOrdersPerCustomer = uniqueCustomers > 0 ? Math.round((orders.length / uniqueCustomers) * 10) / 10 : 0;

    // Top customers by order count
    const topCustomers = Array.from(customerOrders.entries())
      .map(([phone, customerOrderList]) => ({
        customerName: customerOrderList[0].customerName,
        phoneNumber: phone,
        orderCount: customerOrderList.length,
        totalSpent: 0, // TODO: Calculate from orderDetails when available as structured data
        lastOrderDate: new Date(Math.max(...customerOrderList.map(o => getTime(o.createdAt))))
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    // Customer order frequency
    const frequencyData = [1, 2, 3, 4, 5].map(count => ({
      orderCount: count,
      customerCount: Array.from(customerOrders.values()).filter(customerOrderList => 
        count === 5 ? customerOrderList.length >= 5 : customerOrderList.length === count
      ).length
    }));

    return {
      uniqueCustomers,
      repeatCustomers,
      avgOrdersPerCustomer,
      topCustomers,
      customerOrderFrequency: frequencyData as Array<{ orderCount: number; customerCount: number }>
    };
  }, [orders]);

  const repeatCustomerRate = customerStats.uniqueCustomers > 0 
    ? Math.round((customerStats.repeatCustomers / customerStats.uniqueCustomers) * 100) 
    : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Customer Analytics</h2>
      
      {/* Customer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-indigo-400 font-medium">Unique Customers</p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-300">{customerStats.uniqueCustomers}</p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-purple-400 font-medium">Repeat Customers</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-300">{customerStats.repeatCustomers}</p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-pink-400 font-medium">Repeat Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-pink-300">{repeatCustomerRate}%</p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-teal-400 font-medium">Avg Orders/Customer</p>
          <p className="text-xl sm:text-2xl font-bold text-teal-300">{customerStats.avgOrdersPerCustomer}</p>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">Top Customers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-700">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Total Spent
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Last Order
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-700">
              {customerStats.topCustomers.length > 0 ? (
                customerStats.topCustomers.map((customer, index) => (
                  <tr key={customer.phoneNumber} className={index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800'}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-xs text-zinc-500">{customer.phoneNumber}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-300 hidden sm:table-cell">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-zinc-500 hidden md:table-cell">
                      {customer.lastOrderDate.toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-zinc-500">
                    No customer data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order Frequency */}
      <div>
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">Customer Order Frequency</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {(customerStats.customerOrderFrequency as Array<{ orderCount: number; customerCount: number }>).map((freq: { orderCount: number; customerCount: number }) => (
            <div key={freq.orderCount} className="bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-center">
              <p className="text-xs text-zinc-400 mb-1">
                {freq.orderCount === 5 ? '5+ Orders' : `${freq.orderCount} Order${freq.orderCount > 1 ? 's' : ''}`}
              </p>
              <p className="text-lg font-bold text-zinc-300">{freq.customerCount}</p>
              <p className="text-xs text-zinc-500">customers</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
