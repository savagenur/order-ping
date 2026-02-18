import { motion, AnimatePresence } from "framer-motion";
import { QrCode, LogOut, BarChart3, Users, ListOrdered, PlusCircle } from "lucide-react";
import MenuButton from "./MenuButton";

interface DashboardHeaderProps {
  cartName: string;
  showMenu: boolean;
  layoutMode: '2-panel' | '3-panel';
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onQRCode: () => void;
  onWorkerStats: () => void;
  onAnalytics: () => void;
  onLayoutToggle: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  cartName,
  showMenu,
  layoutMode,
  onMenuToggle,
  onMenuClose,
  onQRCode,
  onWorkerStats,
  onAnalytics,
  onLayoutToggle,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white leading-tight tracking-normal normal-case">
            OrderPing
          </h1>
          <p className="text-xs text-zinc-400 font-medium">{cartName}</p>
        </div>

        {/* Menu toggle */}
        <div className="relative">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={onMenuClose} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-sm font-medium text-white">{cartName}</p>
                    <p className="text-xs text-zinc-500 truncate">Chef Dashboard</p>
                  </div>
                  <div className="py-1">
                    <MenuButton icon={<QrCode className="w-4 h-4" />} label="QR Code" onClick={onQRCode} />
                    <MenuButton icon={<Users className="w-4 h-4" />} label="Worker Stats" onClick={onWorkerStats} />
                    <MenuButton icon={<BarChart3 className="w-4 h-4" />} label="Analytics" onClick={onAnalytics} />
                    <div className="hidden md:block border-t border-zinc-800 my-1"></div>
                    <MenuButton 
                      icon={layoutMode === '3-panel' ? <ListOrdered className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />} 
                      label={layoutMode === '3-panel' ? '2 Panel Layout' : '3 Panel Layout'} 
                      onClick={onLayoutToggle} 
                    />
                    <MenuButton icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={onLogout} danger />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
