import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showTagline?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'auto'; // 'light' means dark background, 'dark' means light background, 'auto' matches active theme
  mode?: 'full' | 'icon';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  variant = 'auto',
  mode = 'full',
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Determine whether to use dark background asset or light background asset
  const isDarkBg = variant === 'light' ? true : variant === 'dark' ? false : isDarkMode;

  const heightClasses = {
    sm: 'h-8 sm:h-9 w-auto',
    md: 'h-10 sm:h-11 w-auto',
    lg: 'h-14 sm:h-16 w-auto',
    xl: 'h-20 sm:h-24 w-auto',
    full: 'w-full h-auto max-h-16 sm:max-h-20',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    full: 'w-full h-auto',
  };

  // If icon mode is requested
  if (mode === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/pwa-icon-dark.png"
          alt="Fix Spend Icon"
          className={`${iconSizes[size]} object-contain rounded-xl shadow-warm-sm hover:scale-105 transition-transform`}
          loading="eager"
        />
      </div>
    );
  }

  const logoSrc = isDarkBg ? '/darkbg-logo-header.png' : '/light-logo-header.png';

  return (
    <div className={`flex flex-col items-center justify-center w-full select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Fix Spend - Manage Fixed Expenses. Grow Your Café."
        className={`${heightClasses[size]} object-contain transition-all ${
          isDarkBg ? 'mix-blend-screen contrast-125' : 'mix-blend-multiply'
        }`}
        loading="eager"
      />
      {showTagline && (
        <span
          className={`text-[10px] sm:text-xs font-semibold tracking-wider uppercase mt-1 ${
            isDarkBg ? 'text-cream/90' : 'text-caramel'
          }`}
        >
          Manage Fixed Expenses. Grow Your Café.
        </span>
      )}
    </div>
  );
};
