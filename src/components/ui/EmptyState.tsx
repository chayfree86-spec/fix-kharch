import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-cream/70 rounded-card border border-dashed border-border-warm text-center my-4">
      <div className="w-14 h-14 rounded-full bg-warm-beige flex items-center justify-center text-caramel mb-3 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-coffee mb-1">{title}</h4>
      <p className="text-xs text-caramel max-w-xs mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-expense-red hover:bg-expense-red-dark text-cream rounded-btn font-semibold text-xs transition-all shadow-warm-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
