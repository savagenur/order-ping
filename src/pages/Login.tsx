import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../stores/authStore";
import { Eye, EyeOff, X, Mail, ArrowLeft } from "lucide-react";
import Logo from "../components/ui/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuthStore();

  // Redirect if already logged in (must be in useEffect, not during render)
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to login";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess(false);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send reset email";
      setResetError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setShowForgotPassword(true);
    setError("");
    setResetError("");
    setResetSuccess(false);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetError("");
    setResetSuccess(false);
  };

  return (
    <div className="min-h-screen min-w-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-2">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-white">OrderPing</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="worker@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Password
              </label>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 relative">
            {/* Close Button */}
            <button
              onClick={closeForgotPassword}
              className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Reset Password
              </h2>
              <p className="text-zinc-400 text-sm">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="reset-email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="worker@example.com"
                />
              </div>

              {/* Error Message */}
              {resetError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-400">{resetError}</p>
                </div>
              )}

              {/* Success Message */}
              {resetSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-sm text-green-400">
                    Success! Please check your email for the reset link.
                  </p>
                  <p className="text-xs text-green-300 mt-2">
                    ⚠️ Check your spam/junk folder - the email may be filtered
                    there.
                  </p>
                  <p className="text-xs text-green-300 mt-1">
                    Search for "OrderPing" if you can't find it.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={resetLoading || resetSuccess}
                  className="w-full bg-amber-500 text-white font-semibold py-4 rounded-xl hover:bg-amber-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="w-full bg-zinc-800 text-zinc-300 font-medium py-4 rounded-xl hover:bg-zinc-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
