import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Order } from "../../types/order";

interface TimeMetricsProps {
  orders: Order[];
}

export default function TimeMetrics({ orders }: TimeMetricsProps) {
  const timeMetrics = useMemo(() => {
    if (orders.length === 0) {
      return {
        ordersByHour: Array(24).fill(0),
        ordersByDay: Array(7).fill(0),
        peakHour: 0,
        peakDay: 0,
        avgOrdersPerDay: 0,
      };
    }

    // Initialize arrays for hours and days
    const ordersByHour = Array(24).fill(0);
    const ordersByDay = Array(7).fill(0);

    // Count orders by hour and day
    orders.forEach((order) => {
      const date = order.createdAt instanceof Date ? order.createdAt : order.createdAt.toDate();
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      ordersByHour[hour]++;
      ordersByDay[day]++;
    });

    // Find peak hour and day
    const peakHour = ordersByHour.indexOf(Math.max(...ordersByHour));
    const peakDay = ordersByDay.indexOf(Math.max(...ordersByDay));

    // Calculate average orders per day
    // Get unique dates from orders
    const uniqueDates = new Set(
      orders.map((order) => {
        const date = order.createdAt instanceof Date ? order.createdAt : order.createdAt.toDate();
        return date.toISOString().split("T")[0];
      }),
    );
    const avgOrdersPerDay =
      uniqueDates.size > 0
        ? Math.round((orders.length / uniqueDates.size) * 10) / 10
        : 0;

    return {
      ordersByHour,
      ordersByDay,
      peakHour,
      peakDay,
      avgOrdersPerDay,
    };
  }, [orders]);

  // Format hour for display (12-hour format with AM/PM)
  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
        Time Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Peak Times */}
        <div>
          <h3 className="text-sm sm:text-md font-medium text-gray-700 mb-2 sm:mb-3">
            Peak Times
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-indigo-600 font-medium">
                Peak Hour
              </p>
              <p className="text-lg sm:text-xl font-bold text-indigo-800">
                {formatHour(timeMetrics.peakHour)}
              </p>
            </div>
            <div className="bg-teal-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-teal-600 font-medium">
                Peak Day
              </p>
              <p className="text-lg sm:text-xl font-bold text-teal-800">
                {dayNames[timeMetrics.peakDay]}
              </p>
            </div>
            <div className="bg-amber-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-amber-600 font-medium">
                Avg Orders Per Day
              </p>
              <p className="text-lg sm:text-xl font-bold text-amber-800">
                {timeMetrics.avgOrdersPerDay}
              </p>
            </div>
          </div>
        </div>

        {/* Orders by Day of Week */}
        <div>
          <h3 className="text-sm sm:text-md font-medium text-gray-700 mb-2 sm:mb-3">
            Orders by Day of Week
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeMetrics.ordersByDay.map((count, index) => ({
                  day: dayNames[index],
                  orders: count,
                  isPeak: index === timeMetrics.peakDay
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                />
                <Bar dataKey="orders" radius={[8, 8, 0, 0]}>
                  {timeMetrics.ordersByDay.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === timeMetrics.peakDay ? '#3b82f6' : '#93c5fd'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Orders by Hour of Day */}
      <div>
        <h3 className="text-sm sm:text-md font-medium text-gray-700 mb-2 sm:mb-3">
          Orders by Hour of Day
        </h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeMetrics.ordersByHour.map((count, index) => ({
                hour: formatHour(index),
                orders: count,
                isPeak: index === timeMetrics.peakHour
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
              <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                {timeMetrics.ordersByHour.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === timeMetrics.peakHour ? '#10b981' : '#86efac'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
