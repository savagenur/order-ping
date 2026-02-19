import { create } from 'zustand';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  cartId: string | null;
  cartName: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: 'admin' | 'worker' | 'superadmin' | null;
  initialized: boolean;
  initialize: () => () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  cartId: null,
  cartName: null,
  isAdmin: false,
  isSuperAdmin: false,
  role: null,
  initialized: false,

  initialize: () => {
    const currentState = get();
    if (currentState.initialized && !currentState.loading) return () => {};

    set({ initialized: true });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const cartId = (idTokenResult.claims.cartId as string) || null;
          const cartName = (idTokenResult.claims.cartName as string) || null;
          const role = (idTokenResult.claims.role as 'admin' | 'worker' | 'superadmin') || null;
          const isAdmin = role === 'admin' || role === 'superadmin';
          const isSuperAdmin = role === 'superadmin';

          set({
            user,
            cartId,
            cartName,
            isAdmin,
            isSuperAdmin,
            role,
            loading: false,
          });
        } catch (error) {
          console.error('Error getting token claims:', error);
          set({ user, loading: false });
        }
      } else {
        set({
          user: null,
          cartId: null,
          cartName: null,
          isAdmin: false,
          isSuperAdmin: false,
          role: null,
          loading: false,
        });
      }
    });

    // Add timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      const currentState = get();
      if (currentState.loading) {
        console.warn('Auth loading timeout - forcing loading to false');
        set({ loading: false });
      }
    }, 10000); // 10 second timeout

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  },

  logout: async () => {
    await signOut(auth);
  },
}));
