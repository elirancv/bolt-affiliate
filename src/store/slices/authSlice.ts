import { StateCreator } from 'zustand';
import { supabase } from '../../services/api';
import { AuthState, AuthActions, RootState } from '../types';
import { logError } from '../../utils/errorHandling';

export const createAuthSlice: StateCreator<
  RootState,
  [],
  [],
  AuthState & AuthActions
> = (set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user ? {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.name,
          avatarUrl: data.user.user_metadata.avatar_url,
        } : null,
        isAuthenticated: !!data.user,
        error: null,
      });
    } catch (error) {
      logError(error, 'Auth:login');
      set({ error: 'Failed to login. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      logError(error, 'Auth:logout');
      set({ error: 'Failed to logout. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
});
