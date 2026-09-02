import React, { useEffect, useState } from 'react';
import { Loader } from './Loader';
import { useTheme } from '../../hooks/useTheme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onFinish, 400);
    }, 1400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const isDark =
    theme === 'dark' ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-warm-beige transition-opacity duration-400 select-none ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto animate-fade-in">
        {/* Brand Splash Graphic — websplash-dark.png for Dark Mode */}
        <div className="w-full max-w-[260px] sm:max-w-[300px] flex items-center justify-center">
          <img
            src={isDark ? '/websplash-dark.png' : '/websplash-transparent.png'}
            alt="Fix Spend Splash"
            className="w-full h-auto object-contain animate-slide-up select-none rounded-2xl transition-all"
            loading="eager"
          />
        </div>

        {/* Theme-matched loading spinner */}
        <div className="mt-7">
          <Loader size="md" />
        </div>
      </div>
    </div>
  );
};
