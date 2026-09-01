/**
 * Auto-update & Cache-bypass system
 * Ensures that whenever new code is deployed or updated, the browser
 * automatically loads the freshest version without requiring manual refresh.
 */

// App build version timestamp
export const APP_BUILD_VERSION = '1.0.1-' + Date.now();
const STORAGE_KEY_VERSION = 'fix_spend_app_version';

export function setupAutoUpdate(): void {
  try {
    // 1. Check version in localStorage
    const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION);
    if (!storedVersion) {
      localStorage.setItem(STORAGE_KEY_VERSION, APP_BUILD_VERSION);
    }

    // 2. Service Worker auto-update listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates periodically every 30 seconds
        setInterval(() => {
          registration.update().catch(() => {});
        }, 30000);

        // When a new service worker is installed & waiting, activate it immediately
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, reload automatically
                window.location.reload();
              }
            });
          }
        });
      });

      // Reload when the controller changes (new SW took over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 3. Clear old browser caches automatically if version changed
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          if (!name.includes('fix-spend-v1')) {
            caches.delete(name);
          }
        }
      });
    }
  } catch (e) {
    console.warn('AutoUpdater warning:', e);
  }
}
