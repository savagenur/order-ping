import { useState, useEffect } from "react";
import { AlertCircle, Clock } from "lucide-react";

interface DeclinedOrderCardProps {
  orderNumber: string;
  paymentId?: string;
  amount?: number;
  expireAt?: Date;
  isPublicView?: boolean;
}

export function DeclinedOrderCard({
  orderNumber,
  paymentId,
  amount,
  expireAt,
  isPublicView = false,
}: DeclinedOrderCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!expireAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiresAt = expireAt.getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expireAt]);

  const formatTimeLeft = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div
      className="
        relative overflow-hidden rounded-lg border
        bg-red-950/30 border-red-900/50
        dark:bg-red-950/20 dark:border-red-900/30
        transition-all duration-300 ease-in-out
        hover:bg-red-950/40 dark:hover:bg-red-950/30
      "
    >
      {/* Status Banner */}
      <div className="flex items-center gap-2 bg-red-900/40 px-4 py-2 border-b border-red-900/30">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-red-200">
          {isPublicView ? "Payment Issue" : "Payment Failed"}
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
      <div className="p-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-red-100">
            Order #{orderNumber}
          </h3>
          {amount && (
            <span className="text-sm font-medium text-red-200">
              ${(amount / 100).toFixed(2)}
            </span>
          )}
        </div>

        {!isPublicView && paymentId && (
          <p className="text-xs text-red-300/60 font-mono">
            Payment: {paymentId.slice(-8)}
          </p>
        )}

        {/* Customer-facing message */}
        {isPublicView && (
          <div className="mt-3 pt-3 border-t border-red-900/30">
            <p className="text-xs text-red-300/80">
              Please contact staff to resolve payment issue
            </p>
          </div>
        )}
      </div>

      {/* Subtle pulse animation for attention */}
      <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
    </div>
  );
}
