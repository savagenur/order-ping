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
          count > 0 ? "bg-green-50 text-green-800 font-medium" : "text-gray-400"
        }`}
      >
        <div className="text-xs text-gray-500 mb-1">{day}</div>
        {count > 0 ? count : ""}
      </div>
    );
  }

  return (
    <div 
      className={`px-1 sm:px-2 py-4 text-center text-xs sm:text-sm ${
        count > 0 ? "bg-green-50 text-green-800" : "text-gray-500"
      }`}
    >
      {count > 0 ? count : "-"}
    </div>
  );
}
