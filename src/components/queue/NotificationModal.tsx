import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Bell, CheckCircle, PlusSquare, Share2, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { isNotificationSupported, subscribeToOrderNotifications } from "../../lib/notifications";
import SafariPointer from "./SafariPointer";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: () => void;
  orderId: string | null;
}

// Extend Navigator interface for iOS standalone detection
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Smart detection logic
const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isIOSSafari = (): boolean => {
  return isIOSDevice() && window.navigator.standalone !== true;
};

export default function NotificationModal({ isOpen, onClose, onNotify, orderId }: NotificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Smart detection: iOS Safari vs Standard mode
  const isIOSSafariMode = isIOSSafari();
  const showIOSInstructions = isIOSSafariMode;

  const handleNotify = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isNotificationSupported()) {
        setError('Notifications are not supported in your browser. Please try a modern browser.');
        return;
      }

      const result = await subscribeToOrderNotifications(orderId);
      
      if (result.success) {
        setSuccess(true);
        onNotify();
        
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            setSuccess(false);
            setError(null);
          }, 300);
        }, 1800);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            onClick={onClose}
          />
          
          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.28, ease: "easeInOut" } }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
            style={{
              background: "linear-gradient(180deg, #18181b 0%, #111113 100%)",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Ambient glow strip at top */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.5) 40%, rgba(251,191,36,0.6) 60%, transparent 100%)",
              }}
            />

            {/* Handle bar */}
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-4 mb-2" />

            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Content */}
            <div className="max-w-sm mx-auto px-6 pt-4 pb-8">
              {/* Success State */}
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.05 }}
                    className="relative w-20 h-20 mx-auto mb-5"
                  >
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl" />
                    <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
                    </div>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl font-bold text-white mb-2"
                  >
                    You're all set!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="text-zinc-400 text-sm leading-relaxed"
                  >
                    We'll send you a ping the moment your order hits the window. Go enjoy your wait.
                  </motion.p>
                </motion.div>
              ) : (
                <>
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="relative w-20 h-20 mx-auto mb-5"
                  >
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl" />
                    <div
                      className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                    >
                      <Bell className="w-9 h-9 text-white" strokeWidth={2} />
                    </div>
                  </motion.div>

                  {/* Heading */}
                  <motion.h3
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="text-[22px] font-bold text-white text-center mb-2 leading-tight"
                  >
                    {showIOSInstructions
                      ? "Get notified on iPhone"
                      : "Don't miss your order"}
                  </motion.h3>

                  {/* Subtext */}
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.13 }}
                    className="text-zinc-400 text-sm text-center leading-relaxed mb-6"
                  >
                    {showIOSInstructions
                      ? "iPhone requires the app on your home screen to send push notifications."
                      : "We'll ping you the second your food is ready at the window — no need to keep checking."}
                  </motion.p>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                    </motion.div>
                  )}

                  {/* iOS Instructions */}
                  {showIOSInstructions ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 }}
                      className="rounded-2xl overflow-hidden mb-5"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      {[
                        { icon: Share2, step: "1", label: "Tap the", highlight: "Share", suffix: "button in Safari" },
                        { icon: PlusSquare, step: "2", label: "Choose", highlight: "Add to Home Screen", suffix: "" },
                        { icon: Smartphone, step: "3", label: "Open", highlight: "OrderPing", suffix: "from your home screen" },
                      ].map(({ icon: Icon, step, label, highlight, suffix }, i) => (
                        <div
                          key={step}
                          className={`flex items-center gap-3.5 px-4 py-3.5 ${i < 2 ? "border-b border-white/5" : ""}`}
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm text-zinc-300">
                            {step}. {label}{" "}
                            <span className="text-white font-semibold">{highlight}</span>
                            {suffix ? ` ${suffix}` : ""}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    /* Notify Me Button */
                    <motion.button
                      onClick={handleNotify}
                      disabled={isLoading}
                      className="w-full text-white font-semibold py-4 px-6 rounded-2xl transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-[15px] mb-1"
                      style={{
                        background: isLoading
                          ? "#D97706"
                          : "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                        boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
                      }}
                      whileHover={{ scale: isLoading ? 1 : 1.02, boxShadow: "0 6px 28px rgba(245,158,11,0.45)" }}
                      whileTap={{ scale: isLoading ? 1 : 0.97 }}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                          />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" strokeWidth={2.5} />
                          Ping Me When Ready
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Dismiss */}
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-sm font-medium py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {showIOSInstructions ? "I'll do this later" : "No thanks"}
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Safari Pointer for iOS users */}
          <SafariPointer isVisible={isOpen} />
        </>
      )}
    </AnimatePresence>
  );
}
