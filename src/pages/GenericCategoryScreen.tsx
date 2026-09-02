import React, { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory, GenericExpenseItem } from '../types';
import { formatINR } from '../utils/currency';
import { SearchInput } from '../components/ui/SearchInput';
import { Modal } from '../components/ui/Modal';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { getCategoryIconComponent } from '../utils/categoryIcons';

interface GenericCategoryScreenProps {
  category: ExpenseCategory;
}

export const GenericCategoryScreen: React.FC<GenericCategoryScreenProps> = ({ category }) => {
  const { selectedMonthData, addCustomExpense, updateCustomExpense, deleteCustomExpense } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GenericExpenseItem | null>(null);

  // Modal Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const typingTimerRef = useRef<any>(null);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const itemsList: GenericExpenseItem[] = selectedMonthData.customExpenses?.[category.id] || [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return itemsList;
    const q = searchQuery.toLowerCase();
    return itemsList.filter(
      item => item.name.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q))
    );
  }, [itemsList, searchQuery]);

  const catTotal = useMemo(() => {
    return itemsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [itemsList]);

  const IconComponent = getCategoryIconComponent(category.icon);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setAmount(0);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleOpenEdit = (item: GenericExpenseItem) => {
    setEditingItem(item);
    setName(item.name);
    setAmount(item.amount);
    setNotes(item.notes || '');
    setFormError('');
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter the expense title');
      return;
    }
    if (amount <= 0) {
      setFormError('Please enter an amount greater than 0');
      return;
    }

    if (editingItem) {
      updateCustomExpense(category.id, editingItem.id, {
        name: name.trim(),
        amount,
        notes: notes.trim() || undefined,
      });
    } else {
      addCustomExpense(category.id, {
        name: name.trim(),
        amount,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Instant inline amount update + Auto-focus Next Input after typing pause
  const handleInlineAmountChange = (
    itemId: string,
    rawVal: string,
    index: number,
    isDesktop: boolean
  ) => {
    const clean = rawVal.replace(/[^0-9]/g, '');
    const num = clean === '' ? 0 : parseInt(clean, 10);
    updateCustomExpense(category.id, itemId, { amount: num });

    // Clear previous timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Auto-focus next input after typing pause (800ms)
    if (clean.length > 0) {
      typingTimerRef.current = setTimeout(() => {
        const refList = isDesktop ? desktopInputRefs.current : mobileInputRefs.current;
        const currentInput = refList[index];
        const nextInput = refList[index + 1];

        if (document.activeElement === currentInput && nextInput) {
          nextInput.focus();
          nextInput.select();
          nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 800);
    }
  };

  // Immediate Keyboard navigation (Enter / ArrowDown / ArrowUp)
  const handleDesktopKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const nextInput = desktopInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
        nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const prevInput = desktopInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
        prevInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const nextInput = mobileInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
        nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const prevInput = mobileInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
        prevInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handlePromptDelete = (item: GenericExpenseItem) => {
    setDeletingId(item.id);
    setDeletingName(item.name);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteCustomExpense(category.id, deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm">
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-coffee">{category.name}</h2>
            <p className="text-xs text-caramel">
              {itemsList.length} records for {selectedMonthData.monthName}
              {category.description && ` • ${category.description}`}
            </p>
          </div>
        </div>

        <div className="bg-warm-beige/70 px-4 py-2 rounded-btn border border-border-warm/60 flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-semibold text-caramel uppercase tracking-wider">
            Total {category.name}:
          </span>
          <span className="text-xl font-bold text-expense-red">
            {formatINR(catTotal)}
          </span>
        </div>
      </div>

      {/* Controls: Search and Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 max-w-lg">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${category.name.toLowerCase()}...`}
            className="flex-1"
          />
          <span className="text-[11px] text-caramel hidden lg:inline font-medium whitespace-nowrap bg-warm-beige/60 px-2.5 py-1.5 rounded-btn">
            ⌨️ Press <kbd className="font-bold text-coffee">Enter</kbd> to jump to next input
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-11 px-4 bg-expense-red hover:bg-expense-red-dark text-cream rounded-btn font-semibold text-sm flex items-center justify-center gap-2 shadow-warm-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add {category.name}</span>
        </button>
      </div>

      {/* Items List / Table */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={IconComponent}
          title={searchQuery ? 'No matching expenses found' : `No ${category.name} added yet`}
          description={
            searchQuery
              ? `No record matches "${searchQuery}". Try a different search.`
              : `Add records to track monthly overheads under ${category.name}.`
          }
          actionText={searchQuery ? undefined : `Add ${category.name}`}
          onAction={searchQuery ? undefined : handleOpenAdd}
        />
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className="bg-cream p-4 rounded-card border border-border-warm shadow-warm-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-warm-beige text-coffee flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-coffee">{item.name}</h4>
                      {item.notes && <p className="text-xs text-caramel">{item.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="w-9 h-9 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee flex items-center justify-center transition-colors"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromptDelete(item)}
                      className="w-9 h-9 rounded-btn bg-warm-beige hover:bg-expense-red-50 text-expense-red flex items-center justify-center transition-colors"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-warm/60">
                  <div className="bg-cream border border-expense-red/30 p-1.5 rounded-btn focus-within:ring-2 focus-within:ring-expense-red/20 focus-within:border-expense-red transition-all">
                    <span className="text-[10px] font-bold text-expense-red uppercase tracking-wider block px-1">
                      Amount (Counted)
                    </span>
                    <div className="relative flex items-center mt-0.5">
                      <span className="absolute left-1.5 text-sm font-bold text-expense-red select-none">
                        ₹
                      </span>
                      <input
                        ref={el => (mobileInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        spellCheck={false}
                        value={item.amount === 0 ? '' : item.amount}
                        placeholder="0"
                        onFocus={e => e.target.select()}
                        onChange={e => handleInlineAmountChange(item.id, e.target.value, idx, false)}
                        onKeyDown={e => handleMobileKeyDown(e, idx)}
                        className="w-full h-8 pl-5 pr-2 bg-transparent text-base font-bold text-expense-red focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Responsive Table */}
          <div className="hidden md:block bg-cream rounded-card border border-border-warm shadow-warm-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-warm-beige/50 text-xs font-bold text-coffee uppercase tracking-wider">
                  <th className="py-3.5 px-5">Expense Title</th>
                  <th className="py-3.5 px-5">Notes / Remark</th>
                  <th className="py-3.5 px-5">Amount (Counted)</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/60 text-sm">
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-warm-beige/30 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-5 font-bold text-coffee">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-warm-beige text-coffee flex items-center justify-center text-xs">
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-5 text-xs text-caramel">
                      {item.notes || '—'}
                    </td>

                    {/* Amount Input */}
                    <td className="py-2.5 px-5">
                      <div className="relative inline-flex items-center w-36 sm:w-44">
                        <span className="absolute left-3 text-sm font-bold text-expense-red select-none pointer-events-none">
                          ₹
                        </span>
                        <input
                          ref={el => (desktopInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="off"
                          spellCheck={false}
                          value={item.amount === 0 ? '' : item.amount}
                          placeholder="0"
                          onFocus={e => e.target.select()}
                          onChange={e => handleInlineAmountChange(item.id, e.target.value, idx, true)}
                          onKeyDown={e => handleDesktopKeyDown(e, idx)}
                          className="w-full h-10 pl-7 pr-3 bg-white border border-border-warm rounded-btn text-sm font-bold text-expense-red placeholder:text-coffee/30 focus:outline-none focus:ring-2 focus:ring-expense-red/20 focus:border-expense-red shadow-sm transition-all"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title={`Edit ${item.name}`}
                          aria-label={`Edit ${item.name}`}
                          className="w-9 h-9 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePromptDelete(item)}
                          title={`Delete ${item.name}`}
                          aria-label={`Delete ${item.name}`}
                          className="w-9 h-9 rounded-btn bg-warm-beige hover:bg-expense-red-50 text-expense-red flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit ${category.name}` : `Add ${category.name}`}
        subtitle={`Monthly overhead record under ${category.name}`}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
              Expense Title <span className="text-expense-red">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder={`e.g. ${category.name} Item`}
              className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
            />
          </div>

          <CurrencyInput
            label="Amount (Counted in Expense)"
            required
            value={amount}
            onChange={val => {
              setAmount(val);
              if (formError) setFormError('');
            }}
            placeholder="0"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
              Notes / Remark (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Vendor name, invoice ref"
              className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-sm text-coffee-dark placeholder:text-coffee/35 focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
            />
          </div>

          {formError && (
            <p className="text-xs font-semibold text-expense-red bg-expense-red/10 p-2.5 rounded-btn animate-fade-in">
              {formError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-12 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-btn bg-expense-red hover:bg-expense-red-dark text-cream font-semibold text-sm shadow-warm-sm transition-all active:scale-[0.98]"
            >
              {editingItem ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${category.name} Record?`}
        message={`Are you sure you want to remove ${deletingName} from this month's expense records? This action cannot be undone.`}
        confirmText="Delete Record"
      />
    </div>
  );
};
