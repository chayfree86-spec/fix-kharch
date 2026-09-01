import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center pt-1 pb-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          isDestructive ? 'bg-expense-red/10 text-expense-red' : 'bg-caramel/10 text-caramel'
        }`}>
          {isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>
        <p className="text-sm text-coffee/80 leading-relaxed px-2">
          {message}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-12 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-coffee/20"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`flex-1 h-12 rounded-btn font-semibold text-sm text-cream shadow-warm-sm transition-all focus:outline-none focus:ring-2 active:scale-[0.98] ${
            isDestructive
              ? 'bg-expense-red hover:bg-expense-red-dark focus:ring-expense-red/30'
              : 'bg-coffee hover:bg-coffee-dark focus:ring-coffee/30'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
