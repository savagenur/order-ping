import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Activity {
  id: string;
  type: 'order' | 'cart' | 'worker';
  action: string;
  timestamp: Date;
  details: string;
}

async function fetchRecentActivity(cartId: string | null, isSuperAdmin: boolean): Promise<Activity[]> {
  const activities: Activity[] = [];
  
  const ordersQuery = isSuperAdmin
    ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5))
    : query(collection(db, 'orders'), where('cartId', '==', cartId), orderBy('createdAt', 'desc'), limit(5));
  
  const ordersSnapshot = await getDocs(ordersQuery);
  
  ordersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    activities.push({
      id: doc.id,
      type: 'order',
      action: `New order #${data.orderNumber || 'N/A'}`,
      timestamp: data.createdAt?.toDate() || new Date(),
      details: `${data.customerName} - ${data.status}`,
    });
  });
  
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return activities.slice(0, 5);
}

interface RecentActivityProps {
  cartId: string | null;
  isSuperAdmin: boolean;
}

export default function RecentActivity({ cartId, isSuperAdmin }: RecentActivityProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recent-activity', cartId, isSuperAdmin],
    queryFn: () => fetchRecentActivity(cartId, isSuperAdmin),
    staleTime: 1000 * 60 * 2,
    enabled: !!cartId || isSuperAdmin,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4" />;
      case 'cart':
        return <CheckCircle className="w-4 h-4" />;
      case 'worker':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        <Clock className="w-5 h-5 text-zinc-500" />
      </div>
      
      {activities.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <div className="shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{activity.action}</p>
                <p className="text-xs text-zinc-500 truncate">{activity.details}</p>
              </div>
              <span className="text-xs text-zinc-500 whitespace-nowrap">{getTimeAgo(activity.timestamp)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
