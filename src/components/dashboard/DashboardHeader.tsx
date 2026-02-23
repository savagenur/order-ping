import { QrCode, LogOut, ListOrdered, PlusCircle, User, Settings } from "lucide-react";
import { auth } from "../../lib/firebase";
import { useAuthStore } from "../../stores/authStore";
import MenuButton from "./MenuButton";

interface DashboardHeaderProps {
  cartName: string;
  showMenu: boolean;
  layoutMode: '2-panel' | '3-panel';
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onQRCode: () => void;
  onProfile: () => void;
  onAdminDashboard: () => void;
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
  onProfile,
  onAdminDashboard,
  onLayoutToggle,
  onLogout,
}: DashboardHeaderProps) {
  const { isAdmin } = useAuthStore();
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="/logox.svg?v=2" 
              alt="OrderPing Logo"
              width="48"
              height="48"
              className="w-12 h-12"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight tracking-normal normal-case">
              OrderPing
            </h1>
            <p className="text-xs text-zinc-400 font-medium">{cartName}</p>
          </div>
        </div>

        {/* Menu toggle */}
        <div className="relative">
          <button
            onClick={onMenuToggle}
            className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={onMenuClose} />
              <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-sm font-medium text-white">{cartName}</p>
                  <p className="text-xs text-zinc-500 truncate">{auth.currentUser?.email || "Chef Dashboard"}</p>
                </div>
                <div className="py-1">
                  <MenuButton icon={<User className="w-4 h-4" />} label="Profile" onClick={onProfile} />
                  <MenuButton icon={<QrCode className="w-4 h-4" />} label="QR Code" onClick={onQRCode} />
                  {isAdmin && (
                    <MenuButton icon={<Settings className="w-4 h-4" />} label="Admin Console" onClick={onAdminDashboard} />
                  )}
                  <div className="hidden md:block border-t border-zinc-800 my-1"></div>
                  <MenuButton 
                    icon={layoutMode === '3-panel' ? <ListOrdered className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />} 
                    label={layoutMode === '3-panel' ? '2 Panel Layout' : '3 Panel Layout'} 
                    onClick={onLayoutToggle} 
                  />
                  <MenuButton icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={onLogout} danger />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
