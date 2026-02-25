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
    name: "Normal",
    hex: "#9CA3AF",
    bg: "bg-gray-400/20",
    text: "text-gray-300",
    border: "border-gray-500",
    glow: "shadow-gray-500/40",
    badge: "bg-gray-500",
    badgeText: "text-white",
  },
  {
    name: "Online",
    hex: "#F59E0B",
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500",
    glow: "shadow-amber-500/40",
    badge: "bg-amber-500",
    badgeText: "text-white",
  },
  {
    name: "Special",
    hex: "#10B981",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500",
    glow: "shadow-[0_0_20px_-5px_#10b981]",
    badge: "bg-emerald-500",
    badgeText: "text-white",
  },
  {
    name: "Priority",
    hex: "#DC2626",
    bg: "bg-red-600/20",
    text: "text-red-400",
    border: "border-red-600",
    glow: "shadow-red-600/40",
    badge: "bg-red-600",
    badgeText: "text-white",
  },
];

export const ORDER_COLOR_OPTIONS: OrderColor[] = [
  ORDER_COLORS[0], // Normal
  ORDER_COLORS[1], // Online
  ORDER_COLORS[2], // Special
  ORDER_COLORS[3], // Priority
];

export function getOrderColor(orderNumber: number): OrderColor {
  return ORDER_COLOR_OPTIONS[(orderNumber - 1) % ORDER_COLOR_OPTIONS.length];
}

export function getOrderColorByName(name: string): OrderColor {
  // Backward compatibility: map old color names to new order types
  if (name === "RED" || name === "PURPLE") {
    return ORDER_COLORS.find((c) => c.name === "Priority") ?? ORDER_COLORS[0];
  }
  if (name === "BLUE") {
    return ORDER_COLORS.find((c) => c.name === "Normal") ?? ORDER_COLORS[0];
  }
  if (name === "ORANGE") {
    return ORDER_COLORS.find((c) => c.name === "Online") ?? ORDER_COLORS[0];
  }
  if (name === "PINK") {
    return ORDER_COLORS.find((c) => c.name === "Special") ?? ORDER_COLORS[0];
  }
  return ORDER_COLORS.find((c) => c.name === name) ?? ORDER_COLORS[0];
}
