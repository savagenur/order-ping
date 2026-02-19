import { Instagram, Star, Globe } from 'lucide-react';

interface QueueFooterProps {
  settings: {
    instagramHandle?: string;
    googleMapsLink?: string;
    websiteUrl?: string;
  };
  pinnedOrderStatus?: string;
}

export default function QueueFooter({ settings, pinnedOrderStatus }: QueueFooterProps) {
  const isReady = pinnedOrderStatus === 'ready';

  // Debug logging
  console.log('QueueFooter settings:', settings);
  console.log('QueueFooter pinnedOrderStatus:', pinnedOrderStatus);

  const formatInstagramUrl = (handle?: string) => {
    if (!handle) return null;
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    return `https://instagram.com/${cleanHandle}`;
  };

  const instagramUrl = formatInstagramUrl(settings.instagramHandle);
  const reviewUrl = settings.googleMapsLink;
  const websiteUrl = settings.websiteUrl;

  console.log('URLs:', { instagramUrl, reviewUrl, websiteUrl });

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
        <a
          href={reviewUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
            isReady 
              ? 'text-blue-400 animate-pulse' 
              : 'text-white hover:text-white'
          }`}
        >
          <Star className="w-6 h-6" />
          <span className="text-xs font-medium">Review Us</span>
        </a>

        {/* Always show for testing - remove conditional */}
        <a
          href={websiteUrl || '#'}
          target="_blank"
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
