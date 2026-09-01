import React, { useState, useMemo, useRef } from 'react';
import { Landmark, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EMIItem } from '../types';
import { formatINR } from '../utils/currency';
import { SearchInput } from '../components/ui/SearchInput';
import { Modal } from '../components/ui/Modal';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';

export const EMIScreen: React.FC = () => {
  const { selectedMonthData, addEMI, updateEMI, deleteEMI, summary } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEMI, setEditingEMI] = useState<EMIItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const filteredEMI = useMemo(() => {
    if (!searchQuery.trim()) return selectedMonthData.emiList;
    const q = searchQuery.toLowerCase();
    return selectedMonthData.emiList.filter(item => item.name.toLowerCase().includes(q));
  }, [selectedMonthData.emiList, searchQuery]);

  const handleOpenAdd = () => {
    setEditingEMI(null);
    setName('');
    setAmount(0);
    setFormError('');
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleOpenEdit = (emi: EMIItem) => {
    setEditingEMI(emi);
    setName(emi.name);
    setAmount(emi.amount);
    setFormError('');
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter the bank / EMI name');
      return;
    }
    if (amount <= 0) {
      setFormError('Please enter an amount greater than 0');
      return;
    }

    if (editingEMI) {
      updateEMI(editingEMI.id, {
        name: name.trim(),
        amount,
      });
    } else {
      addEMI({
        name: name.trim(),
        amount,
      });
    }

    setIsModalOpen(false);
  };

  const handlePromptDelete = (emi: EMIItem) => {
    setDeletingId(emi.id);
    setDeletingName(emi.name);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteEMI(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-caramel text-cream flex items-center justify-center shadow-sm">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-coffee">Bank EMI</h2>
            <p className="text-xs text-caramel">
              {selectedMonthData.emiList.length} loan & credit accounts for {selectedMonthData.monthName}
            </p>
          </div>
        </div>

        <div className="bg-warm-beige/70 px-4 py-2 rounded-btn border border-border-warm/60 flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-semibold text-caramel uppercase tracking-wider">
            Total Bank EMI:
          </span>
          <span className="text-xl font-bold text-expense-red">
            {formatINR(summary.emiTotal)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search bank or EMI..."
          className="flex-1 max-w-md"
        />

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-11 px-4 bg-expense-red hover:bg-expense-red-dark text-cream rounded-btn font-semibold text-sm flex items-center justify-center gap-2 shadow-warm-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add EMI</span>
        </button>
      </div>

      {/* EMI Items Grid */}
      {filteredEMI.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={searchQuery ? 'No matching EMI found' : 'No EMI added yet'}
          description={
            searchQuery
              ? `No record matches "${searchQuery}". Try a different name.`
              : 'Add your business loans, credit accounts, and café EMI commitments.'
          }
          actionText={searchQuery ? undefined : 'Add EMI'}
          onAction={searchQuery ? undefined : handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEMI.map(emi => (
            <div
              key={emi.id}
              className="bg-cream p-4 rounded-card border border-border-warm shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-warm-beige text-caramel flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-coffee leading-snug">{emi.name}</h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(emi)}
                    className="w-7 h-7 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee flex items-center justify-center transition-colors"
                    aria-label={`Edit ${emi.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePromptDelete(emi)}
                    className="w-7 h-7 rounded-btn bg-warm-beige hover:bg-expense-red-50 text-expense-red flex items-center justify-center transition-colors"
                    aria-label={`Delete ${emi.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-border-warm/60 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-caramel uppercase tracking-wider">
                  Amount
                </span>
                <span className="text-lg font-bold text-expense-red">
                  {formatINR(emi.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit EMI Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEMI ? 'Edit Bank EMI' : 'Add Bank EMI'}
        subtitle="Monthly loan or EMI installment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
              EMI / Bank Name <span className="text-expense-red">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="e.g. CRED (Sandeep), HDFC Loan"
              className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
            />
          </div>

          <CurrencyInput
            label="EMI Amount"
            required
            value={amount}
            onChange={val => {
              setAmount(val);
              if (formError) setFormError('');
            }}
            placeholder="0"
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
              {editingEMI ? 'Update EMI' : 'Save EMI'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Bank EMI?"
        message={`Are you sure you want to remove ${deletingName} from this month's EMI records?`}
        confirmText="Delete EMI"
      />
    </div>
  );
};
