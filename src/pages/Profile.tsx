import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Calendar, Shield, Store } from "lucide-react";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../stores/authStore";
import LogoutModal from "../components/dashboard/LogoutModal";

export default function Profile() {
  const navigate = useNavigate();
  const { user, cartId, cartName, logout, role } = useAuthStore();
  const [creationTime, setCreationTime] = useState<string>("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (auth.currentUser?.metadata?.creationTime) {
      const date = new Date(auth.currentUser.metadata.creationTime);
      setCreationTime(date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }
  }, []);

  const handleShowLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white">Profile</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Worker Profile</h2>
              <p className="text-sm text-zinc-400">Account Information</p>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Email</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Member Since</p>
                <p className="text-white font-medium">{creationTime || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Account Type</p>
                <p className="text-white font-medium capitalize">{role || 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Assigned Cart</p>
                <p className="text-white font-medium">{cartName || "Not assigned"}</p>
                {cartId && (
                  <p className="text-xs text-zinc-500 mt-1">ID: {cartId}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition cursor-pointer text-left"
            >
              Back to Dashboard
            </button>

            <button
              onClick={handleShowLogoutModal}
              className="w-full px-4 py-3 bg-red-900/50 text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/70 hover:text-red-300 transition cursor-pointer text-left"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-600">
            OrderPing v1.0.0
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Worker Management System
          </p>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        show={showLogoutModal}
        cartName={cartName || "Unknown"}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
