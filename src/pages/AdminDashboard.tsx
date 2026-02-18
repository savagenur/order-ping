import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import StatsCard from '../components/admin/StatsCard';
import QuickActions from '../components/admin/QuickActions';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCarts: 0,
    totalWorkers: 0,
    totalOrders: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get all carts
      const cartsSnapshot = await getDocs(collection(db, 'carts'));
      const activeCarts = cartsSnapshot.docs.filter(doc => doc.data().active !== false);
      
      // Get all workers
      const workersSnapshot = await getDocs(collection(db, 'workers'));
      const activeWorkers = workersSnapshot.docs.filter(doc => doc.data().active !== false);
      
      // Get all orders for order stats
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      let todayCount = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Count today's orders
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt >= today) {
          todayCount++;
        }
      });

      setStats({
        totalCarts: activeCarts.length,
        totalWorkers: activeWorkers.length,
        totalOrders: ordersSnapshot.size,
        todayOrders: todayCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">OrderPing Management</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm border border-red-600 text-red-600 hover:bg-red-50 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Carts"
            value={stats.totalCarts}
            bgColor="bg-indigo-100"
            iconColor="text-indigo-600"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <StatsCard
            title="Workers"
            value={stats.totalWorkers}
            bgColor="bg-green-100"
            iconColor="text-green-600"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            bgColor="bg-blue-100"
            iconColor="text-blue-600"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />

          <StatsCard
            title="Today's Orders"
            value={stats.todayOrders}
            bgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        <QuickActions />
      </div>
    </div>
  );
}