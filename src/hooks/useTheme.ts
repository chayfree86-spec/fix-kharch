import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'fix_spend_theme';
export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  return 'light'; // default
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#120c08' : '#3B2314');
}

// Global subscribers for instant reactive synchronization across all components
const themeListeners = new Set<(theme: Theme) => void>();
let currentGlobalTheme: Theme = getStoredTheme();

function notifyThemeChange(newTheme: Theme) {
  currentGlobalTheme = newTheme;
  saveTheme(newTheme);
  applyTheme(newTheme);
  themeListeners.forEach(fn => fn(newTheme));
}

/**
 * Executes a cinematic Sunset / Sunrise top-to-bottom curtain wipe transition
 * using modern browser View Transitions API with graceful fallback.
 */
function transitionToTheme(targetTheme: Theme) {
  const isCurrentlyDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const activeCurrent: Theme = isCurrentlyDark ? 'dark' : 'light';

  if (activeCurrent === targetTheme) return;

  // 'sunrise' (Dark -> Light) or 'sunset' (Light -> Dark)
  const transitionType = targetTheme === 'light' ? 'sunrise' : 'sunset';

  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.documentElement.setAttribute('data-theme-transition', transitionType);
    const transition = (document as any).startViewTransition(() => {
      notifyThemeChange(targetTheme);
    });

    transition.finished
      .finally(() => {
        document.documentElement.removeAttribute('data-theme-transition');
      })
      .catch(() => {
        document.documentElement.removeAttribute('data-theme-transition');
      });
  } else {
    notifyThemeChange(targetTheme);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return currentGlobalTheme;
  });

  useEffect(() => {
    const syncFromDOM = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const active: Theme = isDark ? 'dark' : 'light';
      setTheme(active);
    };

    syncFromDOM();

    const handleThemeChange = (newTheme: Theme) => {
      setTheme(newTheme);
    };

    themeListeners.add(handleThemeChange);
    return () => {
      themeListeners.delete(handleThemeChange);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const isCurrentlyDark =
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const nextTheme: Theme = isCurrentlyDark ? 'light' : 'dark';
    transitionToTheme(nextTheme);
  }, []);

  const setExplicitTheme = useCallback((newTheme: Theme) => {
    transitionToTheme(newTheme);
  }, []);

  return { theme, toggleTheme, setTheme: setExplicitTheme };
}
