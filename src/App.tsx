import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useCallback, useState, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useOrderStore } from './stores/orderStore';
import { useTrackedOrdersStore } from './stores/trackedOrdersStore';
import { useUserSync } from './hooks/useUserSync';
import { getOrCreateUserId, ACTIVE_CART_KEY } from './lib/pwaUtils';
import { removeTrackedOrder } from './lib/userSync';
import QRHandler from './components/QRHandler';
import MiniTracker from './components/MiniTracker';
import AdminRoute from './components/AdminRoute';
import AdminOnlyRoute from './components/AdminOnlyRoute';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Queue = lazy(() => import('./pages/Queue'));
const About = lazy(() => import('./pages/About'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const WorkerStats = lazy(() => import('./pages/WorkerStats'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminCarts = lazy(() => import('./pages/AdminCarts'));
const AdminWorkers = lazy(() => import('./pages/AdminWorkers'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-pulse text-lg text-zinc-500">Loading...</div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const initialize = useAuthStore((s) => s.initialize);
  const queryClient = useQueryClient();
  const subscribeToOrders = useOrderStore((s) => s.subscribeToOrders);
  const unsubscribeFromOrders = useOrderStore((s) => s.unsubscribeFromOrders);

  // Tracked orders store
  const { trackedOrders, setTrackedOrderIds } = useTrackedOrdersStore();

  // Track active cartId for global subscription
  const [activeCartId, setActiveCartId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_CART_KEY)
  );

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  // Global order subscription - singleton pattern
  useEffect(() => {
    if (activeCartId) {
      console.log(' [APP] Initializing global order subscription for cart:', activeCartId);
      subscribeToOrders(activeCartId);
    } else {
      console.log(' [APP] No active cart, unsubscribing from orders');
      unsubscribeFromOrders();
    }

    return () => {
      // Cleanup on unmount
      unsubscribeFromOrders();
    };
  }, [activeCartId, subscribeToOrders, unsubscribeFromOrders]);

  // Listen for cart changes from localStorage (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = () => {
      const newCartId = localStorage.getItem(ACTIVE_CART_KEY);
      if (newCartId !== activeCartId) {
        console.log(' [APP] Cart changed via storage event:', newCartId);
        setActiveCartId(newCartId);
      }
    };

    const handleFocusChange = () => {
      const newCartId = localStorage.getItem(ACTIVE_CART_KEY);
      if (newCartId !== activeCartId) {
        console.log(' [APP] Cart changed via focus event:', newCartId);
        setActiveCartId(newCartId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocusChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocusChange);
    };
  }, [activeCartId]);

  const handleCartChanged = useCallback(
    (newCartId: string) => {
      console.log(' [APP] handleCartChanged called with', newCartId);
      // Update active cart which will trigger subscription change
      setActiveCartId(newCartId);
      // Invalidate cart settings query
      queryClient.invalidateQueries({ queryKey: ['cart-settings', newCartId] });
      // Fire synthetic focus event for any remaining listeners
      console.log(' [APP] Dispatching synthetic focus event');
      window.dispatchEvent(new Event('focus'));
    },
    [queryClient],
  );

  // Resolve the persistent anonymous userId (URL → localStorage → new UUID)
  const userId = getOrCreateUserId();

  // Handle tracked orders changes from Firestore
  const handleTrackedOrdersChanged = useCallback(
    (orderIds: string[]) => {
      console.log(' [APP] Tracked orders changed:', orderIds);
      setTrackedOrderIds(orderIds);
    },
    [setTrackedOrderIds],
  );

  // Handle removing a tracked order
  const handleRemoveTrackedOrder = useCallback(
    async (orderId: string) => {
      if (!userId) return;
      try {
        await removeTrackedOrder(userId, orderId);
        console.log(' [APP] Removed tracked order:', orderId);
      } catch (error) {
        console.error(' [APP] Failed to remove tracked order:', error);
      }
    },
    [userId],
  );

  // Real-time listener on /users/{userId}: fires whenever Safari writes a new
  // currentCartId (QR scan), selectedOrderId, or trackedOrderIds changes.
  useUserSync({ 
    userId, 
    onCartChanged: handleCartChanged,
    onTrackedOrdersChanged: handleTrackedOrdersChanged,
    // onOrderChanged is handled by Queue component directly
  });

  // Determine if MiniTracker should be shown (hide on dashboard pages and queue page)
  // Queue page has its own Active Tracking header, so MiniTracker is redundant there
  const shouldShowMiniTracker = !location.pathname.startsWith('/dashboard') && 
                                !location.pathname.startsWith('/admin') && 
                                !location.pathname.startsWith('/login') && 
                                !location.pathname.startsWith('/register') &&
                                !location.pathname.startsWith('/profile') &&
                                !location.pathname.startsWith('/worker-stats') &&
                                !location.pathname.startsWith('/analytics') &&
                                !location.pathname.startsWith('/queue');

  return (
    <>
      {/* Intercepts ?cart=<id> on any URL, saves to localStorage, redirects to /queue */}
      <QRHandler />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<About />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Worker Routes - Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker-stats"
          element={
            <AdminOnlyRoute>
              <WorkerStats />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <AdminOnlyRoute>
              <Analytics />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes - Admin Only */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/carts"
          element={
            <AdminRoute>
              <AdminCarts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/workers"
          element={
            <AdminRoute>
              <AdminWorkers />
            </AdminRoute>
          }
        />
      </Routes>
      </Suspense>
      
      {/* MiniTracker - visible on queue and public pages */}
      {shouldShowMiniTracker && (
        <MiniTracker
          trackedOrders={trackedOrders}
          onRemoveOrder={handleRemoveTrackedOrder}
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;