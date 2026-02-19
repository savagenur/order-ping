import Logo from '../ui/Logo';

interface QueueHeaderProps {
  cartName: string;
}

export default function QueueHeader({ cartName }: QueueHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight tracking-normal normal-case">
              OrderPing
            </h1>
            {cartName && (
              <p className="text-xs text-zinc-400 font-medium">{cartName}</p>
            )}
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
