interface HourlyChartProps {
  hourlyDistribution: { [hour: string]: number };
  peakHour: { hour: string; count: number };
}

export default function HourlyChart({ hourlyDistribution, peakHour }: HourlyChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const maxCount = Math.max(...Object.values(hourlyDistribution), 1);
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Hourly Distribution</h3>
        <div className="text-sm text-zinc-400">
          Peak: <span className="text-purple-400 font-medium">{peakHour.hour}:00 ({peakHour.count} orders)</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {hours.map(hour => {
          const count = hourlyDistribution[hour] || 0;
          const percentage = (count / maxCount) * 100;
          const isPeakHour = hour === peakHour.hour;
          
          return (
            <div key={hour} className="flex items-center space-x-2">
              <div className="w-12 text-xs text-zinc-400 text-right">{hour}:00</div>
              <div className="flex-1 bg-zinc-800 rounded-full h-6 relative overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPeakHour ? 'bg-purple-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                >
                  {count > 0 && (
                    <span className="text-xs text-white font-medium px-2 leading-6">
                      {count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {Object.keys(hourlyDistribution).length === 0 && (
        <div className="text-center text-zinc-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hourly data available</p>
        </div>
      )}
    </div>
  );
}
