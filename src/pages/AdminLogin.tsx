import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, Shield } from 'lucide-react';
import type { FirebaseError } from 'firebase/app';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { isAdmin, loading: authLoading } = useAuthStore();

  // Redirect if already admin (must be in useEffect, not during render)
  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user has admin or superadmin role
      const idTokenResult = await userCredential.user.getIdTokenResult();
      
      if (idTokenResult.claims.role === 'admin' || idTokenResult.claims.role === 'superadmin') {
        navigate('/admin/dashboard');
      } else {
        setError('Access denied. Admin privileges required.');
        await auth.signOut();
      }
    } catch (err) {
      const firebaseError = err as FirebaseError;
      console.error('Login error:', firebaseError);
      setError(firebaseError.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-full">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-zinc-400">OrderPing Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="admin@orderpingx.com"
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
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
              className="w-full bg-linear-to-r from-indigo-500 to-purple-500 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login to Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}