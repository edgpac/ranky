import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth/google': 'http://localhost:3001',
      '/auth/reauth': 'http://localhost:3001',
      '/auth/presignup': 'http://localhost:3001',
      '/auth/logout': 'http://localhost:3001',
    },
  },
});
