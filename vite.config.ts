import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React vendor bundle
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          
          // UI components bundle
          if (id.includes('node_modules/lucide-react/') || 
              id.includes('node_modules/react-hot-toast/') ||
              id.includes('node_modules/@radix-ui/')) {
            return 'ui';
          }
          
          // Database bundle
          if (id.includes('node_modules/@supabase/')) {
            return 'db';
          }

          // Charts bundle
          if (id.includes('node_modules/chart.js/') || 
              id.includes('node_modules/react-chartjs-2/')) {
            return 'charts';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});