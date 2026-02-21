import { motion } from "framer-motion";
import { QrCode, ScanLine, Smartphone, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ACTIVE_CART_KEY } from "../lib/pwaUtils";

const steps = [
  {
    icon: QrCode,
    title: "Find the QR code",
    description: "Look for the OrderPing QR code posted at the cart, counter, or table.",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.25)",
  },
  {
    icon: ScanLine,
    title: "Scan with your phone",
    description: "Open your camera app and point it at the QR code — no app download needed.",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.25)",
  },
  {
    icon: Smartphone,
    title: "Watch your queue live",
    description: "See exactly where your order is in the queue and get notified when it's ready.",
    color: "#10B981",
    glow: "rgba(16,185,129,0.25)",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

const WelcomePage = () => {
  const navigate = useNavigate();

  // Listen for cartId changes while user is viewing the welcome page
  useEffect(() => {
    const checkCartId = () => {
      const cartId = localStorage.getItem(ACTIVE_CART_KEY);
      if (cartId) {
        // Force page refresh to let the router handle the route change properly
        window.location.href = '/queue';
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkCartId()) return;

    // Listen for storage events (cross-tab changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACTIVE_CART_KEY && e.newValue) {
        window.location.href = '/queue';
      }
    };

    // Simple polling every 500ms to catch same-tab changes faster
    const pollInterval = setInterval(checkCartId, 500);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-between px-5 py-12 overflow-hidden relative">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Top logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 self-start"
      >
        <img src="/logox.svg" alt="OrderPing" className="w-7 h-7" />
        <span className="text-white font-bold text-base tracking-tight">OrderPing</span>
      </motion.div>

      {/* Main content */}
      <div className="w-full max-w-sm flex flex-col items-center text-center mt-10">
        {/* Hero icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
          className="relative mb-8"
        >
          <div
            className="absolute inset-0 rounded-3xl blur-2xl"
            style={{ background: "rgba(59,130,246,0.3)", transform: "scale(1.3)" }}
          />
          <div
            className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)" }}
          >
            <QrCode className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>

          {/* Ping rings */}
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-3xl border border-blue-500/30"
              animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
            />
          ))}
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-extrabold text-white leading-tight mb-3"
        >
          Skip the wait,<br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #3b82f6)" }}
          >
            not the food.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="text-zinc-400 text-[15px] leading-relaxed mb-10"
        >
          Scan the QR code at your cart or restaurant to track your order live — right from your phone.
        </motion.p>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full flex flex-col gap-3 mb-10"
        >
          {steps.map(({ icon: Icon, title, description, color, glow }, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-start gap-4 rounded-2xl p-4 text-left"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: glow, boxShadow: `0 0 16px ${glow}` }}
              >
                <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">{title}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(16,185,129,0.08) 100%)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ScanLine className="w-4 h-4 text-blue-400" />
          </motion.div>
          <p className="text-blue-300 text-xs font-medium">
            Point your camera at any OrderPing QR code to begin
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-3 mt-10"
      >
        <button
          onClick={() => navigate("/login")}
          className="text-zinc-600 hover:text-zinc-400 text-xs font-medium transition-colors"
        >
          Are you a worker? <span className="text-zinc-500 underline underline-offset-2">Login here</span>
        </button>

        <div className="flex items-center gap-1.5 text-zinc-700 text-[10px] tracking-widest font-semibold uppercase">
          <Zap className="w-2.5 h-2.5" />
          Powered by OrderPing
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
