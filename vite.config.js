import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    https: false, // Set to true if you have SSL certs for camera access on mobile
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['opencv.js']
  }
});
