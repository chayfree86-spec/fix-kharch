import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { CurrencyInput } from '../ui/CurrencyInput';

export const GlobalQuickActionModal: React.FC = () => {
  const { quickActionType, setQuickActionType, addStaff, addEMI, addShopExpense, addOtherExpense } = useApp();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [fixAmount, setFixAmount] = useState<number>(0);
  const [error, setError] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickActionType) {
      setName('');
      setAmount(0);
      setFixAmount(0);
      setError('');
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [quickActionType]);

  if (!quickActionType) return null;

  const getTitles = () => {
    switch (quickActionType) {
      case 'staff':
        return {
          title: 'Add Staff Member',
          subtitle: 'Enter staff name, actual amount, and fixed salary reference',
          nameLabel: 'Staff Name',
          namePlaceholder: 'e.g. Rahul Sharma',
        };
      case 'emi':
        return {
          title: 'Add Bank EMI',
          subtitle: 'Enter bank/loan EMI details and monthly amount',
          nameLabel: 'EMI / Bank Name',
          namePlaceholder: 'e.g. HDFC Loan, CRED',
        };
      case 'shop':
        return {
          title: 'Add Shop Expense',
          subtitle: 'Enter recurring café shop expense',
          nameLabel: 'Expense Name',
          namePlaceholder: 'e.g. Shop Rent, Electricity Bill',
        };
      case 'other':
        return {
          title: 'Add Other Expense',
          subtitle: 'Enter miscellaneous café expense',
          nameLabel: 'Expense Name',
          namePlaceholder: 'e.g. Packaging, Coffee beans',
        };
    }
  };

  const { title, subtitle, nameLabel, namePlaceholder } = getTitles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (amount <= 0) {
      setError('Please enter an amount greater than 0');
      return;
    }

    if (quickActionType === 'staff') {
      addStaff({
        name: name.trim(),
        amount,
        fixAmount: fixAmount > 0 ? fixAmount : amount,
      });
    } else if (quickActionType === 'emi') {
      addEMI({
        name: name.trim(),
        amount,
      });
    } else if (quickActionType === 'shop') {
      addShopExpense({
        name: name.trim(),
        amount,
      });
    } else if (quickActionType === 'other') {
      addOtherExpense({
        name: name.trim(),
        amount,
      });
    }

    setQuickActionType(null);
  };

  return (
    <Modal
      isOpen={!!quickActionType}
      onClose={() => setQuickActionType(null)}
      title={title}
      subtitle={subtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
            {nameLabel} <span className="text-expense-red">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder={namePlaceholder}
            className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
          />
        </div>

        {/* Amount Input */}
        <CurrencyInput
          label={quickActionType === 'staff' ? 'Amount (Counted in Expense)' : 'Amount'}
          required
          value={amount}
          onChange={val => {
            setAmount(val);
            if (error) setError('');
          }}
          placeholder="0"
          helperText={
            quickActionType === 'staff'
              ? 'This is the actual expense counted towards monthly total.'
              : undefined
          }
        />

        {/* Fix Amount Input (Staff Only) */}
        {quickActionType === 'staff' && (
          <CurrencyInput
            label="Fix Amount (Reference Only)"
            value={fixAmount}
            onChange={val => setFixAmount(val)}
            placeholder="0"
            helperText="Fixed salary benchmark. Not added to monthly total."
          />
        )}

        {error && (
          <p className="text-xs font-semibold text-expense-red animate-fade-in bg-expense-red/10 p-2 rounded-btn">
            {error}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => setQuickActionType(null)}
            className="flex-1 h-12 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-coffee/20"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-12 rounded-btn bg-expense-red hover:bg-expense-red-dark text-cream font-semibold text-sm shadow-warm-sm transition-all focus:outline-none focus:ring-2 focus:ring-expense-red/30 active:scale-[0.98]"
          >
            Save Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
