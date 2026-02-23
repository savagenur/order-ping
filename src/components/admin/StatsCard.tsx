import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  delay?: number;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  bgColor, 
  iconColor, 
  trend,
  subtitle,
  delay = 0 
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value === 0) return <Minus className="w-3 h-3" />;
    return trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend || trend.value === 0) return 'text-zinc-500';
    return trend.isPositive ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-linear-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg p-6 hover:border-zinc-700 transition-all hover:shadow-xl group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`shrink-0 ${bgColor} rounded-lg p-3 group-hover:scale-110 transition-transform duration-200`}>
          <div className={`h-6 w-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-400 mb-1">{title}</p>
        <motion.p 
          className="text-3xl font-bold text-white mb-1"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.1, type: "spring" }}
        >
          {value.toLocaleString()}
        </motion.p>
        {subtitle && (
          <p className="text-xs text-zinc-500">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
