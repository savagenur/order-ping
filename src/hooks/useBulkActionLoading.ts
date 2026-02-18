import { useMemo } from "react";
import type { Order } from "../types/order";

interface UseBulkActionLoadingProps {
  orders: Order[];
  markReady: { isPending: boolean };
  markCompleted: { isPending: boolean };
}

interface UseBulkActionLoadingReturn {
  markingAllReady: boolean;
  markingAllCompleted: boolean;
}

export function useBulkActionLoading({
  orders,
  markReady,
  markCompleted,
}: UseBulkActionLoadingProps): UseBulkActionLoadingReturn {
  return useMemo(() => {
    const preparingOrders = orders.filter((o) => o.status === "pending");
    const readyOrders = orders.filter((o) => o.status === "ready");

    const markingAllReady = preparingOrders.length > 0 && 
      preparingOrders.length === orders.filter(o => o.status === "pending" && markReady.isPending).length;
    
    const markingAllCompleted = readyOrders.length > 0 && 
      readyOrders.length === orders.filter(o => o.status === "ready" && markCompleted.isPending).length;

    return {
      markingAllReady,
      markingAllCompleted,
    };
  }, [orders, markReady.isPending, markCompleted.isPending]);
}
