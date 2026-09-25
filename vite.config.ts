/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // Game is small; keep one predictable output folder for Netlify.
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    // Allow testing from a phone on the same network: `npm run dev -- --host`.
    host: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // All date logic is pinned to Europe/Madrid explicitly; this TZ makes sure
    // tests never pass only because the machine happens to be in Madrid.
    env: { TZ: 'America/Los_Angeles' },
  },
});
