import { Instagram, Star, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order } from "../../types/order";

interface QueueFooterProps {
  settings: {
    instagramHandle?: string;
    placeId?: string;
    websiteUrl?: string;
  };
  pinnedOrderStatus?: string;
  trackedOrders?: Order[];
  currentCartId?: string | null;
}

export default function QueueFooter({ settings, trackedOrders = [], currentCartId }: QueueFooterProps) {
  // Check if current cart has at least one ready order in tracked orders
  const isReady = trackedOrders.some(order => 
    order.cartId === currentCartId && order.status === "ready"
  );

  if (!settings || !settings.instagramHandle || !settings.placeId || !settings.websiteUrl) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 pt-3 pb-4">
          <div className="max-w-2xl mx-auto flex items-center justify-around gap-3">
            <div className="w-10 h-10 bg-zinc-800/60 rounded-xl animate-pulse" />
            <div className="flex-1 h-12 bg-zinc-800/60 rounded-2xl animate-pulse" />
            <div className="w-10 h-10 bg-zinc-800/60 rounded-xl animate-pulse" />
          </div>
        </div>
      </footer>
    );
  }

  const formatInstagramUrl = (handle?: string) => {
    if (!handle) return null;
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    return `https://www.instagram.com/${cleanHandle}`;
  };

  const instagramUrl = formatInstagramUrl(settings.instagramHandle);
  const reviewUrl = settings.placeId
    ? settings.placeId.startsWith('https://')
      ? settings.placeId
      : `https://search.google.com/local/writereview?placeid=${settings.placeId}`
    : undefined;
  const websiteUrl = settings.websiteUrl;

  const handleExternalLink = (url?: string | null) => {
    if (!url || url === '#') return false;
    return true;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      {/* Top border accent */}
      <div
        className="h-px w-full"
        style={{
          background: isReady
            ? 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6) 40%, rgba(251,191,36,0.5) 60%, transparent)'
            : 'linear-gradient(90deg, transparent, rgba(63,63,70,0.8) 40%, rgba(63,63,70,0.8) 60%, transparent)',
        }}
      />

      <div className="bg-zinc-950/95 backdrop-blur-xl px-4 pt-3 pb-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">

          {/* Instagram */}
          <a
            href={instagramUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (!handleExternalLink(instagramUrl)) e.preventDefault(); }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200 active:scale-90 shrink-0 ${
              instagramUrl
                ? 'text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 bg-zinc-800/50'
                : 'text-zinc-700 cursor-not-allowed bg-zinc-800/30'
            }`}
          >
            <Instagram className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wide uppercase">Follow</span>
          </a>

          {/* Review Us — center, dominant CTA */}
          <motion.a
            href={reviewUrl || '#'}
            onClick={(e) => { if (!handleExternalLink(reviewUrl)) e.preventDefault(); }}
            className="flex-1 relative overflow-hidden"
            animate={isReady ? { scale: [1, 1.02, 1] } : undefined}
            transition={{ duration: 1.8, repeat: isReady ? Infinity : 0, ease: 'easeInOut' }}
            style={{ willChange: isReady ? 'transform' : 'auto' }}
          >
            {/* Glow layer */}
            {isReady && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.35) 0%, transparent 70%)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            <div
              className={`relative flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 transition-all duration-300 ${
                isReady
                  ? 'bg-linear-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg'
                  : reviewUrl
                  ? 'bg-zinc-800/70 border border-zinc-700/60 hover:border-zinc-600'
                  : 'bg-zinc-800/40 border border-zinc-800 cursor-not-allowed'
              }`}
              style={
                isReady
                  ? { boxShadow: '0 0 20px rgba(245,158,11,0.5), 0 4px 12px rgba(0,0,0,0.4)' }
                  : undefined
              }
            >
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={isReady ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : undefined}
                    transition={{ duration: 1.8, repeat: isReady ? Infinity : 0, delay: i * 0.1, ease: 'easeInOut' }}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${isReady ? 'text-amber-900 fill-amber-900' : 'text-zinc-500 fill-zinc-600'}`}
                    />
                  </motion.div>
                ))}
              </div>
              <span
                className={`text-sm font-extrabold tracking-wide ${
                  isReady ? 'text-amber-950' : reviewUrl ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                {isReady ? 'Leave a Review!' : 'Review Us'}
              </span>
            </div>
          </motion.a>

          {/* Website */}
          <a
            href={websiteUrl || '#'}
            onClick={(e) => { if (!handleExternalLink(websiteUrl)) e.preventDefault(); }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200 active:scale-90 shrink-0 ${
              websiteUrl
                ? 'text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 bg-zinc-800/50'
                : 'text-zinc-700 cursor-not-allowed bg-zinc-800/30'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wide uppercase">Website</span>
          </a>

        </div>
      </div>
    </footer>
  );
}
