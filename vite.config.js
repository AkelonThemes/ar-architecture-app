import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    host: true, // Listen on all network interfaces
    port: 5173,
    // Try to use HTTPS if certificates exist, otherwise HTTP
    https: fs.existsSync('localhost-key.pem') ? {
      key: fs.readFileSync('localhost-key.pem'),
      cert: fs.readFileSync('localhost-cert.pem'),
    } : false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['opencv.js']
  }
});
