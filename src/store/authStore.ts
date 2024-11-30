import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserMetadata } from '../types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  initialized: false,

  setUser: (user) => set({ user, isLoading: false }),
  setError: (error) => set({ error }),

  initializeAuth: async () => {
    // If already initialized and we have a user, don't initialize again
    if (get().initialized && get().user) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        const metadata = session.user.user_metadata as UserMetadata;
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          metadata: {
            first_name: metadata?.first_name || '',
            last_name: metadata?.last_name || '',
            subscription_tier: metadata?.subscription_tier || 'free'
          }
        };
        set({ user, isLoading: false, initialized: true });
      } else {
        set({ user: null, isLoading: false, initialized: true });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false, initialized: true });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, error: null });
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));