import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TimeMetricsOptimizedProps {
  metrics: {
    hourlyOrders: number[];
    dailyOrders: number[];
  };
}

export default function TimeMetricsOptimized({ metrics }: TimeMetricsOptimizedProps) {
  // Format hour for display (12-hour format with AM/PM)
  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  // Day names
  const dayNames = useMemo(() => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], []);

  // Find peak hour and day
  const peakHour = useMemo(() => {
    const maxOrders = Math.max(...metrics.hourlyOrders);
    return metrics.hourlyOrders.indexOf(maxOrders);
  }, [metrics.hourlyOrders]);

  const peakDay = useMemo(() => {
    const maxOrders = Math.max(...metrics.dailyOrders);
    return metrics.dailyOrders.indexOf(maxOrders);
  }, [metrics.dailyOrders]);

  // Prepare chart data
  const hourlyChartData = useMemo(() => 
    metrics.hourlyOrders.map((count, index) => ({
      hour: formatHour(index),
      orders: count,
      isPeak: index === peakHour
    })), [metrics.hourlyOrders, peakHour]
  );

  const dailyChartData = useMemo(() => 
    metrics.dailyOrders.map((count, index) => ({
      day: dayNames[index],
      orders: count,
      isPeak: index === peakDay
    })), [metrics.dailyOrders, peakDay, dayNames]
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
        Time Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Peak Times */}
        <div>
          <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">
            Peak Times
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-indigo-400 font-medium">
                Peak Hour
              </p>
              <p className="text-lg sm:text-xl font-bold text-indigo-300">
                {formatHour(peakHour)}
              </p>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-teal-400 font-medium">
                Peak Day
              </p>
              <p className="text-lg sm:text-xl font-bold text-teal-300">
                {dayNames[peakDay]}
              </p>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-amber-400 font-medium">
                Total Orders Analyzed
              </p>
              <p className="text-lg sm:text-xl font-bold text-amber-300">
                {metrics.hourlyOrders.reduce((sum, count) => sum + count, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Orders by Day of Week */}
        <div>
          <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">
            Orders by Day of Week
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width={500} height={250} minWidth={0} minHeight={undefined} aspect={undefined}>
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#4b5563' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#4b5563' }}
                  label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#f3f4f6'
                  }}
                  labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                />
                <Bar dataKey="orders" radius={[8, 8, 0, 0]}>
                  {dailyChartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === peakDay ? '#60a5fa' : '#1e40af'} 
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
        <h3 className="text-sm sm:text-md font-medium text-zinc-300 mb-2 sm:mb-3">
          Orders by Hour of Day
        </h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width={500} height={250} minWidth={0} minHeight={undefined} aspect={undefined}>
            <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={{ stroke: '#4b5563' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={{ stroke: '#4b5563' }}
                label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#f3f4f6'
                }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
              />
              <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                {hourlyChartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === peakHour ? '#34d399' : '#059669'} 
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
