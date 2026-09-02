import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap: Record<NonNullable<LoaderProps['size']>, string> = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-11 h-11 border-4',
};

/** A small theme-matched spinner (warm ring + expense-red arc). */
export const Loader: React.FC<LoaderProps> = ({ size = 'md', label, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
    <span
      role="status"
      aria-label="Loading"
      className={`${sizeMap[size]} rounded-full border-border-warm border-t-expense-red animate-spin`}
    />
    {label && <span className="text-xs font-medium text-caramel">{label}</span>}
  </div>
);

/** Full-screen theme loader for app-level waiting states. */
export const FullScreenLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-warm-beige">
    <Loader size="lg" label={label} />
  </div>
);
