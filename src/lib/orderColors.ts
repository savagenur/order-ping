export interface OrderColor {
  name: string;
  hex: string;
  bg: string;
  text: string;
  border: string;
  glow: string;
  badge: string;
  badgeText: string;
}

const ORDER_COLORS: OrderColor[] = [
  {
    name: "BLUE",
    hex: "#3b82f6",
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500",
    glow: "shadow-blue-500/40",
    badge: "bg-blue-500",
    badgeText: "text-white",
  },
  {
    name: "ORANGE",
    hex: "#f59e0b",
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500",
    glow: "shadow-orange-500/40",
    badge: "bg-orange-500",
    badgeText: "text-black",
  },
  {
    name: "PINK",
    hex: "#d946ef",
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    border: "border-pink-500",
    glow: "shadow-pink-500/40",
    badge: "bg-pink-500",
    badgeText: "text-white",
  },
  {
    name: "PURPLE",
    hex: "#a855f7",
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500",
    glow: "shadow-purple-500/40",
    badge: "bg-purple-500",
    badgeText: "text-white",
  },
  {
    name: "GREEN",
    hex: "#10b981",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500",
    glow: "shadow-[0_0_20px_-5px_#10b981]",
    badge: "bg-emerald-500",
    badgeText: "text-white",
  },
];

export const ORDER_COLOR_OPTIONS: OrderColor[] = [
  ORDER_COLORS[0], // BLUE
  ORDER_COLORS[1], // ORANGE
  ORDER_COLORS[2], // PINK
  ORDER_COLORS[3], // PURPLE
];

export function getOrderColor(orderNumber: number): OrderColor {
  return ORDER_COLORS[orderNumber % ORDER_COLORS.length];
}

export function getOrderColorByName(name: string): OrderColor {
  // Backward compatibility: map RED to PURPLE
  if (name === "RED") {
    return ORDER_COLORS.find((c) => c.name === "PURPLE") ?? ORDER_COLORS[0];
  }
  return ORDER_COLORS.find((c) => c.name === name) ?? ORDER_COLORS[0];
}
