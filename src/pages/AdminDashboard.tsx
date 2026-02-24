import { useAuthStore } from '../stores/authStore';
import { useRoleBasedStats } from '../hooks/useAdminQueries';
import StatsCard from '../components/admin/StatsCard';
import QuickActions from '../components/admin/QuickActions';
import RecentActivity from '../components/admin/RecentActivity';
import { ORDER_COLOR_OPTIONS } from '../lib/orderColors';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, Package, Clock, Activity, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { cartId, isSuperAdmin, loading: authLoading } = useAuthStore();

  // TanStack Query - role-based stats (cached 5 min with localStorage)
  const { data: stats, isLoading, error, refetch, isFetching } = useRoleBasedStats(cartId, isSuperAdmin);

  // Calculate trends (mock data - in production, compare with previous period)
  const trends = useMemo(() => {
    if (!stats) return null;
    return {
      carts: { value: 0, isPositive: true },
      workers: { value: 12, isPositive: true },
      orders: { value: 8, isPositive: true },
      today: { value: 15, isPositive: true },
    };
  }, [stats]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-zinc-500">
          {authLoading ? 'Authenticating...' : 'Loading dashboard...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-zinc-400">Failed to load dashboard data.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-zinc-500">No data available...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b border-zinc-800 sticky top-0 z-10 backdrop-blur-sm bg-zinc-900/95"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Carts"
            value={stats.totalCarts}
            bgColor={ORDER_COLOR_OPTIONS[0].bg}
            iconColor={ORDER_COLOR_OPTIONS[0].text}
            trend={trends?.carts}
            subtitle={isSuperAdmin ? 'Active carts' : 'Your cart'}
            delay={0}
            icon={<ShoppingCart className="w-6 h-6" />}
          />

          <StatsCard
            title="Workers"
            value={stats.totalWorkers}
            bgColor={ORDER_COLOR_OPTIONS[1].bg}
            iconColor={ORDER_COLOR_OPTIONS[1].text}
            trend={trends?.workers}
            subtitle="Active workers"
            delay={0.05}
            icon={<Users className="w-6 h-6" />}
          />

          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            bgColor={ORDER_COLOR_OPTIONS[2].bg}
            iconColor={ORDER_COLOR_OPTIONS[2].text}
            trend={trends?.orders}
            subtitle="All time"
            delay={0.1}
            icon={<Package className="w-6 h-6" />}
          />

          <StatsCard
            title="Today's Orders"
            value={stats.todayOrders}
            bgColor={ORDER_COLOR_OPTIONS[3].bg}
            iconColor={ORDER_COLOR_OPTIONS[3].text}
            trend={trends?.today}
            subtitle="Last 24 hours"
            delay={0.15}
            icon={<Clock className="w-6 h-6" />}
          />
        </div>

        {/* Additional Stats Row */}
        {stats.weekOrders !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Week Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.weekOrders?.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Month Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.monthOrders?.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Active Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.activeOrders?.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <RecentActivity cartId={cartId} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Cache indicator */}
      {!isFetching && stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500"
        >
          Cached data • Auto-refresh in 5min
        </motion.div>
      )}
    </div>
  );
}