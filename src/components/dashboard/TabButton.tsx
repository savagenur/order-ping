interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  position: 'left' | 'right';
}

export default function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  position,
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative cursor-pointer ${
        active
          ? "text-blue-400"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold leading-none">
          {badge}
        </span>
      )}
      {active && (
        <div
          className={`absolute top-0 h-0.5 bg-blue-500 transition-transform duration-300 ease-out ${
            position === 'left' ? 'left-0 right-0' : 'left-0 right-0'
          }`}
          style={{
            transform: position === 'left' ? 'translateX(0)' : 'translateX(0)',
          }}
        />
      )}
    </button>
  );
}
