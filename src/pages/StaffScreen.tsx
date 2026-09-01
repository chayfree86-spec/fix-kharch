import React, { useState, useMemo, useRef } from 'react';
import { UsersRound, Plus, Pencil, Trash2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StaffItem } from '../types';
import { formatINR } from '../utils/currency';
import { SearchInput } from '../components/ui/SearchInput';
import { Modal } from '../components/ui/Modal';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';

export const StaffScreen: React.FC = () => {
  const { selectedMonthData, addStaff, updateStaff, deleteStaff, summary } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);

  // Form fields for modal
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [fixAmount, setFixAmount] = useState<number>(0);
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

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return selectedMonthData.staffList;
    const q = searchQuery.toLowerCase();
    return selectedMonthData.staffList.filter(s => s.name.toLowerCase().includes(q));
  }, [selectedMonthData.staffList, searchQuery]);

  const totalStaffAmount = useMemo(() => {
    return filteredStaff.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [filteredStaff]);

  const totalStaffFixAmount = useMemo(() => {
    return filteredStaff.reduce((sum, s) => sum + (Number(s.fixAmount) || 0), 0);
  }, [filteredStaff]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setName('');
    setAmount(0);
    setFixAmount(0);
    setFormError('');
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleOpenEdit = (staff: StaffItem) => {
    setEditingStaff(staff);
    setName(staff.name);
    setAmount(staff.amount);
    setFixAmount(staff.fixAmount);
    setFormError('');
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter the staff member name');
      return;
    }
    if (amount <= 0) {
      setFormError('Please enter an actual amount greater than 0');
      return;
    }

    if (editingStaff) {
      updateStaff(editingStaff.id, {
        name: name.trim(),
        amount,
        fixAmount: fixAmount > 0 ? fixAmount : amount,
      });
    } else {
      addStaff({
        name: name.trim(),
        amount,
        fixAmount: fixAmount > 0 ? fixAmount : amount,
      });
    }

    setIsModalOpen(false);
  };

  // Instant inline amount update + Auto-focus Next Input after typing pause
  const handleInlineAmountChange = (
    staffId: string,
    rawVal: string,
    index: number,
    isDesktop: boolean
  ) => {
    const clean = rawVal.replace(/[^0-9]/g, '');
    const num = clean === '' ? 0 : parseInt(clean, 10);
    updateStaff(staffId, { amount: num });

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

        // Only advance if the user is still actively focused on this input
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

  const handlePromptDelete = (staff: StaffItem) => {
    setDeletingId(staff.id);
    setDeletingName(staff.name);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteStaff(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner with Both Totals Highlighted */}
      <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
            <UsersRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-coffee">Staff Kharch</h2>
            <p className="text-xs text-caramel">
              {filteredStaff.length} staff records for {selectedMonthData.monthName}
            </p>
          </div>
        </div>

        {/* Both Totals Highlighted in Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          {/* Fix Amount (Reference Total) */}
          <div className="bg-warm-beige/70 px-3.5 py-2 rounded-btn border border-border-warm/60 flex items-center gap-2">
            <span className="text-xs font-semibold text-caramel uppercase tracking-wider">
              Fix Total:
            </span>
            <span className="text-base sm:text-lg font-bold text-caramel">
              {formatINR(totalStaffFixAmount)}
            </span>
          </div>

          {/* Counted Expense Total */}
          <div className="bg-expense-red px-4 py-2 rounded-btn text-cream flex items-center gap-2 shadow-warm-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-cream/90">
              Total Expense:
            </span>
            <span className="text-lg sm:text-xl font-bold text-cream">
              {formatINR(totalStaffAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls: Search, Hint & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 max-w-lg">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search staff by name..."
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
          <span>Add Staff</span>
        </button>
      </div>

      {/* Staff List / Table */}
      {filteredStaff.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={searchQuery ? 'No matching staff found' : 'No staff added yet'}
          description={
            searchQuery
              ? `No staff member matches "${searchQuery}". Try a different name.`
              : 'Add your café staff to track monthly salary and fixed expense allowances.'
          }
          actionText={searchQuery ? undefined : 'Add Staff'}
          onAction={searchQuery ? undefined : handleOpenAdd}
        />
      ) : (
        <>
          {/* Mobile View: Cards (Order: Name -> Fix Amount -> Amount Input) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStaff.map((staff, idx) => (
              <div
                key={staff.id}
                className="bg-cream p-4 rounded-card border border-border-warm shadow-warm-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-warm-beige text-coffee flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <h4 className="text-base font-bold text-coffee">{staff.name}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(staff)}
                      className="w-8 h-8 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee flex items-center justify-center transition-colors"
                      aria-label={`Edit ${staff.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromptDelete(staff)}
                      className="w-8 h-8 rounded-btn bg-warm-beige hover:bg-expense-red-50 text-expense-red flex items-center justify-center transition-colors"
                      aria-label={`Delete ${staff.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border-warm/60 items-center">
                  {/* 1. Fix Amount (Benchmark Reference) */}
                  <div className="bg-warm-beige/40 p-2.5 rounded-btn h-full flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-caramel uppercase tracking-wider block">
                      Fix Amount
                    </span>
                    <span className="text-base font-bold text-caramel mt-0.5">
                      {formatINR(staff.fixAmount)}
                    </span>
                  </div>

                  {/* 2. Amount (Editable Input with auto-save) */}
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
                        value={staff.amount === 0 ? '' : staff.amount}
                        placeholder="0"
                        onFocus={e => e.target.select()}
                        onChange={e => handleInlineAmountChange(staff.id, e.target.value, idx, false)}
                        onKeyDown={e => handleMobileKeyDown(e, idx)}
                        className="w-full h-8 pl-5 pr-2 bg-transparent text-base font-bold text-expense-red focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Responsive Table (Order: Name -> Fix Amount -> Amount Input -> Actions) */}
          <div className="hidden md:block bg-cream rounded-card border border-border-warm shadow-warm-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-warm-beige/50 text-xs font-bold text-coffee uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Name</th>
                  <th className="py-3.5 px-5">Fix Amount (Ref)</th>
                  <th className="py-3.5 px-5">Amount (Counted)</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/60 text-sm">
                {filteredStaff.map((staff, idx) => (
                  <tr key={staff.id} className="hover:bg-warm-beige/30 transition-colors">
                    {/* Staff Name */}
                    <td className="py-3.5 px-5 font-bold text-coffee">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-warm-beige text-coffee flex items-center justify-center text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>{staff.name}</span>
                      </div>
                    </td>

                    {/* 1. Fix Amount (Benchmark Reference) */}
                    <td className="py-3.5 px-5 font-bold text-caramel">
                      {formatINR(staff.fixAmount)}
                    </td>

                    {/* 2. Amount (Inline Editable Input Box with Auto-save & Next Focus on Enter) */}
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
                          value={staff.amount === 0 ? '' : staff.amount}
                          placeholder="0"
                          onFocus={e => e.target.select()}
                          onChange={e => handleInlineAmountChange(staff.id, e.target.value, idx, true)}
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
                          onClick={() => handleOpenEdit(staff)}
                          title={`Edit ${staff.name}`}
                          aria-label={`Edit ${staff.name}`}
                          className="w-8 h-8 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePromptDelete(staff)}
                          title={`Delete ${staff.name}`}
                          aria-label={`Delete ${staff.name}`}
                          className="w-8 h-8 rounded-btn bg-warm-beige hover:bg-expense-red-50 text-expense-red flex items-center justify-center transition-colors"
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

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
        subtitle="Staff monthly expense record"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
              Staff Name <span className="text-expense-red">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="e.g. Vishal Prajapati"
              className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
            />
          </div>

          <CurrencyInput
            label="Fix Amount (Reference Salary)"
            value={fixAmount}
            onChange={val => setFixAmount(val)}
            placeholder="0"
            helperText="Benchmark fixed salary. Not added to monthly expense sum."
          />

          <CurrencyInput
            label="Amount (Counted in Expense)"
            required
            value={amount}
            onChange={val => {
              setAmount(val);
              if (formError) setFormError('');
            }}
            placeholder="0"
            helperText="This amount is counted in the total café expense."
          />

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
              {editingStaff ? 'Update Staff' : 'Save Staff'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Staff Member?"
        message={`Are you sure you want to remove ${deletingName} from this month's expense records? This action cannot be undone.`}
        confirmText="Delete Staff"
      />
    </div>
  );
};
