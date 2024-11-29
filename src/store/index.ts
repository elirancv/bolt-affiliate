import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createUISlice } from './slices/uiSlice';
import type { RootState, RootActions } from './types';
import { useAuthStore } from './auth/authStore';
import { useUIStore } from './ui/uiStore';

export const useStore = create<RootState & RootActions>()((...args) => ({
  ...createAuthSlice(...args),
  ...createUISlice(...args),
}));

// Typed selectors
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, login, logout, clearError } = useStore();
  return { user, isAuthenticated, isLoading, error, login, logout, clearError };
};

export const useUI = () => {
  const { theme, sidebarOpen, setTheme, toggleSidebar } = useStore();
  return { theme, sidebarOpen, setTheme, toggleSidebar };
};

export {
  useAuthStore,
  useUIStore
};
