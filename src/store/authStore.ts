import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserMetadata } from '../types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, error: null });
    } catch (error) {
      set({ error: 'Failed to sign out. Please try again.' });
    }
  },
  refreshSession: async () => {
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
            first_name: metadata?.first_name,
            last_name: metadata?.last_name,
            subscription_tier: metadata?.subscription_tier || 'free'
          }
        };
        set({ user, error: null });
      } else {
        set({ user: null });
      }
    } catch (error: any) {
      set({ error: error.message });
      console.error('Session refresh error:', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));