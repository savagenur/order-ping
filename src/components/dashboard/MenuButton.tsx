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
      className={`w-full px-4 py-2.5 text-sm flex items-center gap-2.5 transition cursor-pointer ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
