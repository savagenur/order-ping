import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Order } from '../types/order';
import { getOrderColorByName } from '../lib/orderColors';

interface MiniTrackerProps {
  trackedOrders: Order[];
  onRemoveOrder: (orderId: string) => void;
  onOrderClick?: (orderId: string) => void;
}

export default function MiniTracker({ trackedOrders, onRemoveOrder, onOrderClick }: MiniTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (trackedOrders.length === 0) {
    return null;
  }

  // Group orders by cart
  const ordersByCart = trackedOrders.reduce((acc, order) => {
    if (!acc[order.cartId]) {
      acc[order.cartId] = {
        cartName: order.cartName,
        orders: [],
      };
    }
    acc[order.cartId].orders.push(order);
    return acc;
  }, {} as Record<string, { cartName: string; orders: Order[] }>);

  const totalOrders = trackedOrders.length;
  const readyCount = trackedOrders.filter(o => o.status === 'ready').length;
  const preparingCount = trackedOrders.filter(o => o.status === 'pending').length;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-white">
                Tracking {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {readyCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                  {readyCount} Ready
                </span>
              )}
              {preparingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                  {preparingCount} Preparing
                </span>
              )}
            </div>
          </div>
          
          <ChevronUp className="w-5 h-5 text-zinc-400" />
        </button>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-[50vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Tracked Orders</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Orders grouped by cart */}
              <div className="px-4 py-3 space-y-4">
                {Object.entries(ordersByCart).map(([cartId, { cartName, orders }]) => (
                  <div key={cartId} className="space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {cartName}
                    </h4>
                    
                    <div className="space-y-2">
                      {orders.map((order) => {
                        const color = getOrderColorByName(order.color || 'BLUE');
                        const isReady = order.status === 'ready';
                        
                        return (
                          <motion.div
                            key={order.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`bg-zinc-800/50 border rounded-lg p-3 flex items-center gap-3 ${
                              isReady ? 'border-emerald-500/50' : 'border-zinc-700'
                            }`}
                            style={{ borderLeftWidth: 3, borderLeftColor: color.hex }}
                            onClick={() => onOrderClick?.(order.id)}
                          >
                            {/* Order Number */}
                            <div className="shrink-0">
                              <span className="font-mono font-bold text-xl text-white">
                                #{order.orderNumber}
                              </span>
                            </div>

                            {/* Order Info */}
                            <div className="flex-1 min-w-0">
                              {order.customerName && (
                                <p className="text-sm text-zinc-300 truncate font-medium">
                                  {order.customerName}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge} ${color.badgeText}`}
                                >
                                  {color.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isReady
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}
                                >
                                  {isReady ? 'Ready' : 'Preparing'}
                                </span>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveOrder(order.id);
                              }}
                              className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
                              title="Stop tracking"
                            >
                              <X className="w-4 h-4 text-zinc-400" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
