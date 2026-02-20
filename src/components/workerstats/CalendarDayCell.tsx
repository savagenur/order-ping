interface CalendarDayCellProps {
  day: number;
  count: number;
  isMobile?: boolean;
}

export default function CalendarDayCell({ day, count, isMobile = false }: CalendarDayCellProps) {
  if (isMobile) {
    return (
      <div 
        className={`text-center py-1 rounded ${
          count > 0 ? "bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500" : "text-zinc-500"
        }`}
      >
        <div className="text-xs text-zinc-400 mb-1">{day}</div>
        {count > 0 ? count : ""}
      </div>
    );
  }

  return (
    <div 
      className={`px-1 sm:px-2 py-4 text-center text-xs sm:text-sm ${
        count > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500" : "text-zinc-500"
      }`}
    >
      {count > 0 ? count : "-"}
    </div>
  );
}
