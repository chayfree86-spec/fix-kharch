/**
 * Auto-update & Cache-bypass system
 * Ensures that whenever new code is deployed or updated, the browser
 * automatically loads the freshest version on every normal refresh.
 */

// Unique build timestamp to detect updates
export const APP_BUILD_VERSION = '1.0.2-' + Date.now();
const STORAGE_KEY_VERSION = 'fix_spend_build_version_tag';

export function setupAutoUpdate(): void {
  try {
    // 1. Proactively clear any legacy Service Workers & CacheStorage on load
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister().catch(() => {});
        });
      }).catch(() => {});
    }

    // 2. Clear all browser CacheStorage instances
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name).catch(() => {});
        });
      }).catch(() => {});
    }

    // 3. Clear legacy mock storage keys
    const legacyKeys = [
      'fix_spend_months_data',
      'fix_spend_months_data_v1',
      'fix_spend_months_data_v2',
      'fix_spend_settings',
      'fix_spend_settings_v1',
      'fix_spend_settings_v2',
    ];
    legacyKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // 4. Track current version
    const lastVersion = localStorage.getItem(STORAGE_KEY_VERSION);
    if (!lastVersion) {
      localStorage.setItem(STORAGE_KEY_VERSION, APP_BUILD_VERSION);
    }
  } catch (e) {
    console.warn('AutoUpdater cache clear error:', e);
  }
}

/**
 * Force clear all cache, service workers, and reload fresh code immediately
 */
export async function clearAllAppCacheAndReload(): Promise<void> {
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }

    // 2. Delete all caches in CacheStorage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }

    // 3. Set fresh version marker
    localStorage.setItem(STORAGE_KEY_VERSION, Date.now().toString());

    // 4. Force hard reload from server
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  } catch (e) {
    window.location.reload();
  }
}

// Attach to window object for console accessibility if needed
if (typeof window !== 'undefined') {
  (window as any).clearAppCache = clearAllAppCacheAndReload;
}
