import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5243, strictPort: true },
  preview: { host: '0.0.0.0', port: 4243, strictPort: true },
  build: { chunkSizeWarningLimit: 3000 },
});
