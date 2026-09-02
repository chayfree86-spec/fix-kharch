import React from 'react';
import { Coffee } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Premium Café-Branded Loader (Red & Coffee Theme)
 * Features dual-orbiting gradient arcs, glowing center pulse, and smooth micro-animations.
 */
export const Loader: React.FC<LoaderProps> = ({ size = 'md', label, className = '' }) => {
  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
          {/* Outer Track */}
          <div className="absolute inset-0 rounded-full border-[2px] border-coffee/20 dark:border-coffee/30" />
          {/* Orbiting Red & Caramel Gradient Arc */}
          <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-expense-red border-r-caramel animate-spin" />
        </div>
        {label && <span className="text-xs font-semibold text-coffee">{label}</span>}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="relative w-11 h-11 flex items-center justify-center">
          {/* Ambient Warm Halo Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-expense-red/20 to-caramel/25 blur-sm animate-pulse" />
          {/* Outer Coffee Track */}
          <div className="absolute inset-0 rounded-full border-[2.5px] border-coffee/15 dark:border-coffee/25" />
          {/* Primary Spinning Red-Caramel Arc */}
          <div
            className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-expense-red border-r-caramel animate-spin"
            style={{ animationDuration: '0.9s' }}
          />
          {/* Inner Counter-Rotating Coffee Arc */}
          <div
            className="absolute inset-1.5 rounded-full border-[2px] border-transparent border-b-expense-red/70 border-l-coffee animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
          />
          {/* Center Glowing Pulse Core */}
          <div className="w-2.5 h-2.5 rounded-full bg-expense-red shadow-[0_0_8px_rgba(238,72,67,0.85)] animate-ping" />
        </div>
        {label && <span className="text-xs font-semibold text-caramel tracking-wide">{label}</span>}
      </div>
    );
  }

  // size === 'lg'
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Ambient Multi-Stop Halo Glow */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-expense-red/30 via-caramel/25 to-coffee/35 blur-md animate-pulse" />
        {/* Outer Orbit Track */}
        <div className="absolute inset-0 rounded-full border-[3px] border-coffee/15 dark:border-coffee/25 shadow-inner" />
        {/* Primary Glowing Red Arc */}
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-expense-red border-r-caramel animate-spin"
          style={{ animationDuration: '1s' }}
        />
        {/* Secondary Counter-Orbiting Coffee Arc */}
        <div
          className="absolute inset-2 rounded-full border-[2.5px] border-transparent border-b-expense-red/80 border-l-coffee animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
        />
        {/* Center Emblem with Coffee Cup Icon */}
        <div className="w-7 h-7 rounded-full bg-cream dark:bg-[#281A12] border border-border-warm flex items-center justify-center shadow-warm-sm z-10">
          <Coffee className="w-3.5 h-3.5 text-expense-red animate-pulse" />
        </div>
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-bold text-coffee tracking-wider uppercase">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Full-screen theme loader for app-level waiting states with rich branded 3D card presentation.
 */
export const FullScreenLoader: React.FC<{ label?: string }> = ({ label = 'Getting things ready…' }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-warm-beige/95 backdrop-blur-md select-none">
    <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-modal bg-cream border border-border-warm shadow-warm-modal max-w-xs sm:max-w-sm w-full mx-4 text-center">
      {/* Background radial accent */}
      <div className="absolute inset-0 rounded-modal overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-expense-red/15 blur-2xl rounded-full" />
      </div>

      <Loader size="lg" />

      <div className="mt-5 space-y-1 z-10">
        <h3 className="text-base font-bold text-coffee tracking-tight">
          Fix Spend
        </h3>
        <p className="text-xs font-medium text-caramel">
          {label}
        </p>
      </div>

      {/* Subtle bottom animated coffee-red progress bar */}
      <div className="mt-5 w-32 h-1.5 bg-warm-beige rounded-full overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-coffee via-expense-red to-caramel rounded-full animate-pulse w-full" />
      </div>
    </div>
  </div>
);
