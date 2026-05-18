import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // /api proxies to the Fly backend in dev so the same fetch('/api/...')
    // works locally and in production (where the same Fly container serves both).
    proxy: {
      '/api': { target: 'https://dhamma.fly.dev', changeOrigin: true, secure: true },
    },
  },
});
