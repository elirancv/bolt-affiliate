import { StateCreator } from 'zustand';
import { UIState, UIActions, RootState } from '../types';
import { THEME_CONFIG } from '../../constants/config';

export const createUISlice: StateCreator<
  RootState,
  [],
  [],
  UIState & UIActions
> = (set) => ({
  theme: 'system',
  sidebarOpen: true,

  setTheme: (theme) => {
    set({ theme });
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
});
