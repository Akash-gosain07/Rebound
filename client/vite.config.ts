import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:4001',
        ws: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'map-vendor': ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          'motion-vendor': ['framer-motion'],
          'socket-vendor': ['socket.io-client']
        }
      }
    }
  }
});
