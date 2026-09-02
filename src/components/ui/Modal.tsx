import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6 bg-coffee-dark/65 backdrop-blur-sm no-x-overflow"
      // Clicking the backdrop area (not the sheet/dialog itself) dismisses it.
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Sheet on mobile (bottom, rounded top only); centered dialog on sm+ */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-cream shadow-warm-modal border border-border-warm text-left overflow-hidden z-10 flex flex-col
          max-h-[88dvh] sm:max-h-[85vh]
          rounded-t-modal sm:rounded-modal sm:my-auto
          animate-slide-up sm:animate-fade-in`}
      >
        {/* Drag handle — mobile only, signals a native bottom sheet */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0" aria-hidden="true">
          <span className="w-10 h-1.5 rounded-full bg-border-warm" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3.5 sm:pt-5 sm:px-6 border-b border-border-warm/60 flex items-center justify-between flex-shrink-0 bg-cream">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-coffee leading-tight truncate">{title}</h3>
            {subtitle && <p className="text-xs text-caramel mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-warm-beige/60 hover:bg-warm-beige text-coffee flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-coffee/20 flex-shrink-0 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body — bottom padding covers the safe area so
            the last field/button is never hidden behind a gesture bar. */}
        <div className="p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 overflow-y-auto space-y-4 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
