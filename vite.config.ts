import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export default defineConfig({
  server: {
    port: 5180,
    strictPort: true,
    host: true,
    headers: noCacheHeaders,
  },
  preview: {
    port: 5180,
    strictPort: true,
    host: true,
    headers: noCacheHeaders,
  },
  plugins: [
    react(),
    VitePWA({
      // New versions activate and reload automatically — no manual refresh /
      // cache clear needed.
      registerType: 'autoUpdate',
      // We register the service worker ourselves in main.tsx (adds periodic
      // update checks), so don't auto-inject a second registration.
      injectRegister: false,
      includeAssets: [
        'favicon.svg',
        'pwa-icon-dark.png',
        'pwa-icon-dark-1.png',
        'light-logo-header.png',
        'darkbg-logo-header.png',
        'websplash.png',
        'websplash-transparent.png',
      ],
      manifest: {
        name: 'Fix Spend - Café Expense Manager',
        short_name: 'Fix Spend',
        description: 'Manage Fixed Expenses. Grow Your Café.',
        theme_color: '#3B2314',
        background_color: '#F5E6D3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-icon-dark.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-dark.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-dark.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // API calls must never be served from cache or the SPA fallback.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
});
