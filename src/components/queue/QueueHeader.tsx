import Logo from '../ui/Logo';

interface QueueHeaderProps {
  cartName: string;
}

export default function QueueHeader({ cartName }: QueueHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80">
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.5) 40%, rgba(59,130,246,0.4) 60%, transparent)" }}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* Left: logo + name */}
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-extrabold text-white leading-none tracking-tight">
              OrderPing
            </h1>
            {cartName && (
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider w-fit">
                <img
                  src="/src/assets/restaurant.svg"
                  alt="Restaurant"
                  className="w-3 h-3"
                  
                />
                {cartName}
              </span>
            )}
          </div>
        </div>

        {/* Right: live badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8"
          style={{ backgroundColor: "rgba(16,185,129,0.06)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
            Live
          </span>
        </div>

      </div>
    </header>
  );
}
