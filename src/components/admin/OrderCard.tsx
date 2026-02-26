import type { Order } from "../../types/order";
import { getOrderColorByName } from "../../lib/orderColors";
import { useState, useEffect } from "react";
import { AlertCircle, Clock } from "lucide-react";

interface OrderCardProps {
  order: Order;
  onAction?: () => void;
  isGhost?: boolean;
  variant?: 'preparing' | 'ready' | 'public';
}

export function OrderCard({ 
  order, 
  onAction, 
  isGhost = false, 
  variant = 'preparing' 
}: OrderCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Countdown timer for declined orders
  useEffect(() => {
    if (order.status !== "declined" || !order.expireAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiresAt = order.expireAt instanceof Date 
        ? order.expireAt.getTime() 
        : order.expireAt?.toDate().getTime();
      if (!expiresAt) return;
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order.expireAt, order.status]);
  // Handle declined orders with special UI
  if (order.status === "declined") {
    const formatTimeLeft = (seconds: number): string => {
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    return (
      <div
        onClick={onAction}
        className={`
          relative overflow-hidden rounded-xl border
          bg-red-950/30 border-red-900/50
          transition-all duration-300 ease-in-out
          hover:bg-red-950/40 cursor-pointer
          ${isGhost ? 'opacity-50' : 'opacity-100'}
        `}
      >
        {/* Status Banner */}
        <div className="flex items-center gap-2 bg-red-900/40 px-4 py-2 border-b border-red-900/30">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-200">
            Payment Failed
          </span>
          
          {/* Countdown Timer */}
          {timeLeft !== null && timeLeft > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-red-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires in {formatTimeLeft(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Order Content */}
        <div className="p-4 flex items-center gap-4">
          {/* Order Number */}
          <div className="shrink-0">
            <span className="font-mono font-extrabold text-3xl text-red-100 leading-none">
              #{order.orderNumber}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {order.amount && (
              <p className="text-sm font-medium text-red-200">
                ${(order.amount / 100).toFixed(2)}
              </p>
            )}
            {order.paymentId && (
              <p className="text-xs text-red-300/60 font-mono">
                Payment: {order.paymentId.slice(-8)}
              </p>
            )}
          </div>
        </div>

        {/* Subtle pulse animation */}
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      </div>
    );
  }

  // Handle expired orders (fade out or hide)
  if (order.status === "expired") {
    return null; // Don't show expired orders
  }

  // Public view (simple display)
  if (variant === 'public') {
    return (
      <div
        className={`
          rounded-lg border p-4
          ${order.status === "pending" ? "bg-blue-950/20 border-blue-900/30" : ""}
          ${order.status === "ready" ? "bg-green-950/20 border-green-900/30" : ""}
          ${order.status === "completed" ? "bg-gray-800/20 border-gray-700/30" : ""}
          transition-all duration-300
        `}
      >
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-lg font-bold text-white">
            Order #{order.orderNumber}
          </h3>
          <span
            className={`
              text-xs font-medium px-2 py-1 rounded
              ${order.status === "pending" ? "bg-blue-900/50 text-blue-200" : ""}
              ${order.status === "ready" ? "bg-green-900/50 text-green-200" : ""}
              ${order.status === "completed" ? "bg-gray-700/50 text-gray-300" : ""}
            `}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {order.orderDetails && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {order.orderDetails}
          </p>
        )}
      </div>
    );
  }

  // Dashboard view (clickable cards with colors)
  const color = getOrderColorByName(order.color || "BLUE");
  
  // Different background colors based on variant
  const bgColor = variant === 'preparing' 
    ? 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30' 
    : 'bg-green-500/20 border-green-500/40 hover:bg-green-500/30';

  return (
    <div
      onClick={onAction}
      className={`${bgColor} border rounded-xl p-4 flex items-center gap-4 transition-all duration-200 cursor-pointer ${
        isGhost ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: color.hex }}
    >
      {/* Order Number + Color Badge */}
      <div className="shrink-0 flex flex-col items-start gap-1">
        <span className="font-mono font-extrabold text-4xl text-white leading-none">
          #{order.orderNumber}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
        >
          {color.name}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {order.customerName && (
          <p className="text-zinc-300 text-sm truncate font-medium">{order.customerName}</p>
        )}
        {order.orderDetails && (
          <p className="text-zinc-500 text-xs truncate mt-0.5">{order.orderDetails}</p>
        )}
      </div>
    </div>
  );
}
