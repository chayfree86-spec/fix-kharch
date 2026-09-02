import React, { useEffect, useState } from 'react';
import { Loader } from './Loader';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onFinish, 400);
    }, 1400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-warm-beige transition-opacity duration-400 select-none ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto animate-fade-in">
        {/* Transparent Brand Splash Graphic (Zero rectangular border/box) */}
        <div className="w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center">
          <img
            src="/websplash-transparent.png"
            alt="Fix Spend Splash"
            className="w-full h-auto object-contain animate-slide-up"
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
