interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export default function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3.5 text-sm flex items-center gap-3 cursor-pointer ${
        danger
          ? "text-red-400 active:bg-red-500/10"
          : "text-zinc-300 active:bg-zinc-800"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {icon}
      {label}
    </button>
  );
}
