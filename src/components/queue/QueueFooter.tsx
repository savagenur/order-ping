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


  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-full">
        {/* Always show for testing - remove conditional */}
        <a
          href={instagramUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-white hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Instagram className="w-6 h-6" />
          <span className="text-xs">Instagram</span>
        </a>

        {/* Always show for testing - remove conditional */}
        <motion.a
          href={reviewUrl || '#'}
          rel="noopener noreferrer"
          className={`flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
            isReady 
              ? 'text-amber-500' 
              : 'text-zinc-500 hover:text-zinc-400'
          }`}
          style={{
            filter: isReady ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' : 'none'
          }}
          animate={isReady ? {
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          } : undefined}
          transition={{
            duration: 2,
            repeat: isReady ? Infinity : 0
          }}
        >
          <Star className="w-6 h-6" />
          <span className="text-xs font-medium">Review Us</span>
        </motion.a>

        {/* Always show for testing - remove conditional */}
        <a
          href={websiteUrl || '#'}
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-white hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Globe className="w-6 h-6" />
          <span className="text-xs">Website</span>
        </a>
      </div>
    </footer>
  );
}
