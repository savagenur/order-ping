import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueueOrders } from "../hooks/useQueueOrders";
import WelcomePage from "../components/WelcomePage";
import LoadingSpinner from "../components/LoadingSpinner";
import QueueHeader from "../components/queue/QueueHeader";
import OrderSearch from "../components/queue/OrderSearch";
import ReadyOrders from "../components/queue/ReadyOrders";
import PendingOrders from "../components/queue/PendingOrders";

export default function Queue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get("cart");

  // TanStack Query - realtime queue orders via Firestore onSnapshot
  const { data, isLoading } = useQueueOrders(cartId);

  const pendingOrders = data?.pendingOrders ?? [];
  const readyOrders = data?.readyOrders ?? [];
  const cartName = data?.cartName ?? "";

  const getPosition = (orderId: string) => {
    return pendingOrders.findIndex((order) => order.id === orderId) + 1;
  };

  const allOrders = [...pendingOrders, ...readyOrders];

  // RENDER LOGIC
  if (!cartId) {
    return <WelcomePage />;
  }

  if (isLoading) {
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
        <div className="text-center mt-8 text-gray-600 text-sm gap-1 flex flex-col">
          <p>Updates automatically • No refresh needed</p>
          {/* Subtle Login Link */}
          <div className=" text-center">
            <p className="text-sm text-gray-600">
              Are you a worker?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors cursor-pointer"
              >
                Login here
              </button>
            </p>
          </div>
          <p className=" text-xs text-gray-500">
            Contact: usalife609@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
