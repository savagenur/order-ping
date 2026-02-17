import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { db } from "../lib/firebase";
import type { Order } from "../types/order";
import InvalidQRCode from "../components/InvalidQrCode";
import LoadingSpinner from "../components/LoadingSpinner";
import QueueHeader from "../components/queue/QueueHeader";
import OrderSearch from "../components/queue/OrderSearch";
import ReadyOrders from "../components/queue/ReadyOrders";
import PendingOrders from "../components/queue/PendingOrders";

// Helper function to safely map Firestore data to Order type
const mapFirestoreToOrder = (docId: string, data: DocumentData): Order => {
  return {
    id: docId,
    orderNumber: data.orderNumber || 0,
    customerName: data.customerName || "",
    phoneNumber: data.phoneNumber || "",
    orderDetails: data.orderDetails,
    status: data.status || "pending",
    cartId: data.cartId || "",
    cartName: data.cartName || "",
    createdAt: data.createdAt?.toDate() || new Date(),
    readyAt: data.readyAt?.toDate(),
    completedAt: data.completedAt?.toDate(),
  };
};

export default function Queue() {
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get("cart");

  // STATE
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [cartName, setCartName] = useState<string>("");

  // FIX: Initialize loading based on whether we even have a cartId to fetch
  const [loading, setLoading] = useState(!!cartId);

  useEffect(() => {
    // Guard: If no cartId, do nothing
    if (!cartId) return;

    // Optimized query: Let Firestore do the heavy lifting
    const ordersQuery = query(
      collection(db, "orders"),
      where("cartId", "==", cartId),
      orderBy("createdAt", "asc"), // Ascending for pending orders (oldest first)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const allOrders: Order[] = [];
        snapshot.forEach((doc) => {
          allOrders.push(mapFirestoreToOrder(doc.id, doc.data()));
        });

        // Set cart name from first order (if available)
        if (allOrders.length > 0 && !cartName) {
          setCartName(allOrders[0].cartName);
        }

        // Filter by status (already sorted by createdAt ascending from Firestore)
        const pending = allOrders.filter((o) => o.status === "pending");

        // Ready orders need to be sorted by readyAt (most recent first)
        const ready = allOrders
          .filter((o) => o.status === "ready")
          .sort(
            (a, b) => (b.readyAt?.getTime() || 0) - (a.readyAt?.getTime() || 0),
          );

        setPendingOrders(pending);
        setReadyOrders(ready);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [cartId, cartName]);

  const getPosition = (orderId: string) => {
    return pendingOrders.findIndex((order) => order.id === orderId) + 1;
  };

  const allOrders = [...pendingOrders, ...readyOrders];

  // RENDER LOGIC
  if (!cartId) {
    return <InvalidQRCode />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen min-w-screen #f2f3f4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QueueHeader cartName={cartName} />

        <OrderSearch orders={allOrders} getPosition={getPosition} />

        <ReadyOrders readyOrders={readyOrders} />

        <PendingOrders pendingOrders={pendingOrders} />

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>Updates automatically • No refresh needed</p>
          <p className="mt-2 text-xs text-gray-500">
            Contact: usalife609@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
