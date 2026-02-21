import { AnimatePresence, motion } from 'framer-motion';
import { PlusSquare, Share2, Smartphone, X } from 'lucide-react';
import { isIOSDevice, isAndroidDevice } from '../../lib/pwaUtils';

interface PWABannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function PWABanner({ isVisible, onDismiss }: PWABannerProps) {
  const ios = isIOSDevice();
  const android = isAndroidDevice();

  const steps = ios
    ? [
        { icon: Share2, label: 'Tap the', highlight: 'Share', suffix: 'button in Safari' },
        { icon: PlusSquare, label: 'Choose', highlight: 'Add to Home Screen', suffix: '' },
        { icon: Smartphone, label: 'Open', highlight: 'OrderPing', suffix: 'from your home screen' },
      ]
    : android
    ? [
        { icon: Share2, label: 'Tap the', highlight: 'menu (⋮)', suffix: 'in your browser' },
        { icon: PlusSquare, label: 'Choose', highlight: 'Add to Home Screen', suffix: '' },
        { icon: Smartphone, label: 'Open', highlight: 'OrderPing', suffix: 'from your home screen' },
      ]
    : null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            onClick={onDismiss}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.28, ease: 'easeInOut' } }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
            style={{
              background: 'linear-gradient(180deg, #18181b 0%, #111113 100%)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Ambient top glow */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.5) 40%, rgba(99,102,241,0.6) 60%, transparent 100%)',
              }}
            />

            {/* Handle */}
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-4 mb-2" />

            {/* Close */}
            <motion.button
              onClick={onDismiss}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>

            <div className="max-w-sm mx-auto px-6 pt-4 pb-8">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                className="relative w-20 h-20 mx-auto mb-5"
              >
                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)' }}
                >
                  <Smartphone className="w-9 h-9 text-white" strokeWidth={2} />
                </div>
              </motion.div>

              {/* Heading */}
              <motion.h3
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="text-[22px] font-bold text-white text-center mb-2 leading-tight"
              >
                Better in the app
              </motion.h3>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13 }}
                className="text-zinc-400 text-sm text-center leading-relaxed mb-6"
              >
                Install OrderPing to your home screen for push notifications and a faster experience.
              </motion.p>

              {/* Step-by-step instructions (iOS / Android) */}
              {steps && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="rounded-2xl overflow-hidden mb-5"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {steps.map(({ icon: Icon, label, highlight, suffix }, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3.5 px-4 py-3.5 ${i < steps.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)' }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-zinc-300">
                        {i + 1}. {label}{' '}
                        <span className="text-white font-semibold">{highlight}</span>
                        {suffix ? ` ${suffix}` : ''}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Stay in Browser */}
              <button
                onClick={onDismiss}
                className="w-full mt-1 text-zinc-500 hover:text-zinc-300 text-sm font-medium py-2 transition-colors"
              >
                Stay in browser
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
