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
    if (get().initialized) return;

    try {
      set({ isLoading: true, error: null });
      console.log('Initializing auth...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session check result:', { session, error });

      if (error) throw error;

      if (session?.user) {
        console.log('Found existing session:', session.user.email);
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
        console.log('No existing session found');
        set({ user: null, isLoading: false, initialized: true });
      }
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      set({ error: error.message, isLoading: false, initialized: true });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, error: null });
    } catch (error: any) {
      set({ error: 'Failed to sign out. Please try again.' });
    }
  }
}));