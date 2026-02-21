import { Instagram, Star, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface QueueFooterProps {
  settings: {
    instagramHandle?: string;
    placeId?: string;
    websiteUrl?: string;
  };
  pinnedOrderStatus?: string;
}

export default function QueueFooter({ settings, pinnedOrderStatus }: QueueFooterProps) {
  const isReady = pinnedOrderStatus === 'ready';

  // Don't render if settings are empty (still loading)
  if (!settings || !settings.instagramHandle || !settings.placeId || !settings.websiteUrl) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-full">
          <div className="w-6 h-6 bg-zinc-800 rounded animate-pulse"></div>
          <div className="w-6 h-6 bg-zinc-800 rounded animate-pulse"></div>
          <div className="w-6 h-6 bg-zinc-800 rounded animate-pulse"></div>
        </div>
      </footer>
    );
  }

  const formatInstagramUrl = (handle?: string) => {
    if (!handle) return null;
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    // Use www.instagram.com for better Android compatibility
    return `https://www.instagram.com/${cleanHandle}`;
  };

  const instagramUrl = formatInstagramUrl(settings.instagramHandle);
  const reviewUrl = settings.placeId ? (
    settings.placeId.startsWith('https://') ? settings.placeId : `https://search.google.com/local/writereview?placeid=${settings.placeId}`
  ) : undefined;
  const websiteUrl = settings.websiteUrl;

  const handleExternalLink = (url?: string | null) => {
    if (!url || url === '#') return false;
    return true;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-full">
        <a
          href={instagramUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (!handleExternalLink(instagramUrl)) e.preventDefault(); }}
          className={`flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
            instagramUrl ? 'text-white hover:text-white' : 'text-zinc-600 cursor-not-allowed'
          }`}
          style={{ opacity: instagramUrl ? 1 : 0.5 }}
        >
          <Instagram className="w-6 h-6" />
          <span className="text-xs">Instagram</span>
        </a>

        <motion.a
          href={reviewUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (!handleExternalLink(reviewUrl)) e.preventDefault(); }}
          className={`flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
            reviewUrl ? (isReady ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-400') : 'text-zinc-600 cursor-not-allowed'
          }`}
          style={{
            filter: isReady && reviewUrl ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' : 'none',
            opacity: reviewUrl ? 1 : 0.5,
            willChange: isReady ? 'transform, opacity' : 'auto',
          }}
          animate={isReady ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : undefined}
          transition={{ duration: 2, repeat: isReady ? Infinity : 0, ease: 'easeInOut' }}
        >
          <Star className="w-6 h-6" />
          <span className="text-xs font-medium">Review Us</span>
        </motion.a>

        <a
          href={websiteUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (!handleExternalLink(websiteUrl)) e.preventDefault(); }}
          className={`flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
            websiteUrl ? 'text-white hover:text-white' : 'text-zinc-600 cursor-not-allowed'
          }`}
          style={{ opacity: websiteUrl ? 1 : 0.5 }}
        >
          <Globe className="w-6 h-6" />
          <span className="text-xs">Website</span>
        </a>
      </div>
    </footer>
  );
}
