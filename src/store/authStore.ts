import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  refreshSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email!,
            subscription_tier: 'free'
          },
          loading: false
        });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      set({ user: null, loading: false });
    }
  }
}));