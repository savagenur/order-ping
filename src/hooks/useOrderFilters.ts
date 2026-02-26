import { useMemo } from "react";
import type { Order } from "../types/order";

interface UseOrderFiltersReturn {
  preparingOrders: Order[];
  readyOrders: Order[];
  declinedOrders: Order[];
  preparingCount: number;
  readyCount: number;
  declinedCount: number;
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
    
    const declinedOrders = orders
      .filter((o) => o.status === "declined")
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toDate().getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toDate().getTime();
        return bTime - aTime; // Newest declined orders first
      });

    const preparingCount = preparingOrders.length;
    const readyCount = readyOrders.length;
    const declinedCount = declinedOrders.length;
    const listCount = preparingCount + readyCount + declinedCount;

    return {
      preparingOrders,
      readyOrders,
      declinedOrders,
      preparingCount,
      readyCount,
      declinedCount,
      listCount,
    };
  }, [orders]);
}
