import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, BarChart3, Settings, TrendingUp } from 'lucide-react';

const actions = [
  {
    to: '/admin/carts',
    icon: ShoppingCart,
    title: 'Manage Carts',
    description: 'Create and manage food carts',
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-600/20',
    hoverBorder: 'hover:border-blue-500',
  },
  {
    to: '/admin/workers',
    icon: Users,
    title: 'Manage Workers',
    description: 'Create and assign workers',
    color: 'orange',
    gradient: 'from-orange-500/20 to-orange-600/20',
    hoverBorder: 'hover:border-orange-500',
  },
  {
    to: '/worker-stats',
    icon: TrendingUp,
    title: 'Worker Stats',
    description: 'View worker performance',
    color: 'teal',
    gradient: 'from-teal-500/20 to-teal-600/20',
    hoverBorder: 'hover:border-teal-500',
  },
  {
    to: '/analytics',
    icon: BarChart3,
    title: 'Analytics',
    description: 'View detailed analytics',
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-emerald-600/20',
    hoverBorder: 'hover:border-emerald-500',
  },
  {
    to: '/profile',
    icon: Settings,
    title: 'Settings',
    description: 'Configure your account',
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-600/20',
    hoverBorder: 'hover:border-purple-500',
  },
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
            >
              <Link
                to={action.to}
                className={`flex flex-col items-center p-4 border-2 border-zinc-700 rounded-xl ${action.hoverBorder} hover:bg-zinc-800/50 transition-all group`}
              >
                <div className={`w-12 h-12 bg-linear-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 text-${action.color}-400`} />
                </div>
                <h3 className="text-sm font-medium text-white text-center mb-1">{action.title}</h3>
                <p className="text-xs text-zinc-500 text-center">{action.description}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
