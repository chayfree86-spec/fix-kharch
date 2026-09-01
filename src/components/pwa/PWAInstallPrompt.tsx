import React, { useEffect, useState } from 'react';
import { Download, X, ExternalLink, Rocket } from 'lucide-react';

const DISMISS_KEY = 'fix_spend_pwa_dismissed_at';
const INSTALLED_KEY = 'fix_spend_pwa_installed';
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// True when the app is running as an installed PWA (not a browser tab).
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function dismissedRecently(): boolean {
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => localStorage.getItem(INSTALLED_KEY) === '1');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Running as the installed app — never show the banner.
    if (isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!dismissedRecently()) setVisible(true);
    };

    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      setInstalled(true);
      setDeferred(null);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // Already installed but opened in a browser tab → offer "Open App".
    if (localStorage.getItem(INSTALLED_KEY) === '1' && !dismissedRecently()) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (isStandalone() || !visible) return null;

  const showInstall = !!deferred;
  const showOpen = !deferred && installed;
  if (!showInstall && !showOpen) return null;

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') setVisible(false);
  };

  const handleOpenApp = () => {
    // Best effort: navigate within the app's scope; on supported platforms the
    // browser offers to open the installed app.
    window.location.href = '/';
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-cream border border-border-warm rounded-card shadow-2xl p-4 flex items-center gap-3 animate-fade-in">
        <div className="relative flex-shrink-0">
          <img
            src="/pwa-icon-dark.png"
            alt="Fix Spend"
            className="w-12 h-12 rounded-xl shadow-warm-sm"
          />
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-expense-red text-cream flex items-center justify-center shadow-sm">
            <Rocket className="w-3 h-3" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-coffee">
            {showOpen ? 'Fix Spend is installed' : 'Install Fix Spend'}
          </h4>
          <p className="text-[11px] text-caramel leading-snug">
            {showOpen
              ? 'Open the app for a faster, full-screen experience.'
              : 'Add to your home screen — fast, full-screen, always up to date.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showInstall && (
            <button
              type="button"
              onClick={handleInstall}
              className="h-9 px-3 bg-expense-red hover:bg-expense-red-dark text-cream rounded-btn font-semibold text-xs flex items-center gap-1.5 shadow-warm-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Install
            </button>
          )}
          {showOpen && (
            <button
              type="button"
              onClick={handleOpenApp}
              className="h-9 px-3 bg-coffee hover:bg-coffee-dark text-cream rounded-btn font-semibold text-xs flex items-center gap-1.5 shadow-warm-sm transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" /> Open App
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="w-9 h-9 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
