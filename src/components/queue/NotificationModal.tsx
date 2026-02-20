import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { subscribeToOrderNotifications, isNotificationSupported } from "../../lib/notifications";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: () => void;
  orderId: string | null;
}

export default function NotificationModal({ isOpen, onClose, onNotify, orderId }: NotificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleNotify = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if notifications are supported
      if (!isNotificationSupported()) {
        setError('Notifications are not supported in your browser. Please try a modern browser.');
        return;
      }

      // Subscribe to notifications
      const result = await subscribeToOrderNotifications(orderId);
      
      if (result.success) {
        setSuccess(true);
        onNotify();
        
        // Close modal with success animation after delay
        setTimeout(() => {
          onClose();
          // Reset states for next time
          setTimeout(() => {
            setSuccess(false);
            setError(null);
          }, 300);
        }, 1500);
      } else {
        setError(result.error || 'Failed to enable notifications.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.3, ease: "easeInOut" } }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl z-50 p-6"
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
            
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            {/* Content */}
            <div className="max-w-sm mx-auto">
              {/* Success State */}
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Notifications Enabled!
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    We'll notify you when your order is ready.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#F59E0B' }}
                  >
                    <Bell className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">
                    Want a ping when your order is ready?
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6 text-center">
                    Get notified as soon as your order is ready for pickup. We'll send you a notification when it's your turn!
                  </p>
                  
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-red-400 text-xs">{error}</p>
                    </motion.div>
                  )}
                  
                  {/* Notify Me Button */}
                  <motion.button
                    onClick={handleNotify}
                    disabled={isLoading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#F59E0B' }}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Enabling...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        Notify Me
                      </>
                    )}
                  </motion.button>
                  
                  {/* Cancel option */}
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full mt-3 text-zinc-400 hover:text-white text-sm font-medium py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    No thanks
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
