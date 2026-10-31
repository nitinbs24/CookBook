import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // IPv4 explicitly: Vite's default "localhost" can bind only [::1], which IPv4-first browsers can't reach.
  // Port fixed because the backends' CORS_ORIGIN expects :5173.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.js'], css: false },
});
