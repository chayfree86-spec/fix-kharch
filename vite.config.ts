import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 5180,
    strictPort: true,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      includeAssets: ['favicon.ico', 'pwa-icon-dark.png', 'light-logo-header.png', 'darkbg-logo-header.png'],
      manifest: {
        name: 'Fix Spend - Café Expense Manager',
        short_name: 'Fix Spend',
        description: 'Manage Fixed Expenses. Grow Your Café.',
        theme_color: '#3B2314',
        background_color: '#F5E6D3',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-icon-dark.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
