import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3001,
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://localhost:5000',
=======
        target: 'http://localhost:4000',
>>>>>>> ai_feature_clean
        changeOrigin: true
      }
    }
  }
});
