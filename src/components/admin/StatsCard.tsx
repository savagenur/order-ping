interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

export default function StatsCard({ title, value, icon, bgColor, iconColor }: StatsCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center">
        <div className={`shrink-0 ${bgColor} rounded-md p-3`}>
          <div className={`h-6 w-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
