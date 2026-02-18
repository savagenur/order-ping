import { useMemo } from "react";
import type { Order } from "../types/order";

interface UseOrderFiltersReturn {
  preparingOrders: Order[];
  readyOrders: Order[];
  preparingCount: number;
  readyCount: number;
  listCount: number;
}

export function useOrderFilters(orders: Order[]): UseOrderFiltersReturn {
  return useMemo(() => {
    const preparingOrders = orders.filter((o) => o.status === "pending");
    const readyOrders = orders
      .filter((o) => o.status === "ready")
      .sort((a, b) => {
        const aTime = a.readyAt instanceof Date ? a.readyAt.getTime() : 0;
        const bTime = b.readyAt instanceof Date ? b.readyAt.getTime() : 0;
        return bTime - aTime;
      });

    const preparingCount = preparingOrders.length;
    const readyCount = readyOrders.length;
    const listCount = preparingCount + readyCount;

    return {
      preparingOrders,
      readyOrders,
      preparingCount,
      readyCount,
      listCount,
    };
  }, [orders]);
}
