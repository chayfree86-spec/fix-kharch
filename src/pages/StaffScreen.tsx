import React, { useState, useMemo, useRef } from 'react';
import { UsersRound, User, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { SearchInput } from '../components/ui/SearchInput';
import { EmptyState } from '../components/ui/EmptyState';

export const StaffScreen: React.FC = () => {
  const { selectedMonthData, updateStaff, staffError, settings, monthLoading } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const desktopInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const typingTimerRef = useRef<any>(null);

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

  const totalStaffAmount = useMemo(
    () => filteredStaff.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
    [filteredStaff]
  );
  const totalStaffFixAmount = useMemo(
    () => filteredStaff.reduce((sum, s) => sum + (Number(s.fixAmount) || 0), 0),
    [filteredStaff]
  );

  const handleInlineAmountChange = (
    staffId: string,
    rawVal: string,
    index: number,
    isDesktop: boolean
  ) => {
    const clean = rawVal.replace(/[^0-9]/g, '');
    const num = clean === '' ? 0 : parseInt(clean, 10);
    updateStaff(staffId, { amount: num });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

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

  const handleKeyNav = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    refList: (HTMLInputElement | null)[]
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const next = refList[index + 1];
      if (next) {
        next.focus();
        next.select();
        next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const prev = refList[index - 1];
      if (prev) {
        prev.focus();
        prev.select();
        prev.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const noBusinessLinked = settings.staffBusinessId === null || settings.staffBusinessId === undefined;

  return (
    <div className="space-y-4">
      {/* Header Banner with Both Totals */}
      <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
            <UsersRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-coffee">Staff Kharch</h2>
            <p className="text-xs text-caramel">
              {filteredStaff.length} staff from Staff-app · {selectedMonthData.monthName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <div className="bg-warm-beige/70 px-3.5 py-2 rounded-btn border border-border-warm/60 flex items-center gap-2">
            <span className="text-xs font-semibold text-caramel uppercase tracking-wider">Fix Total:</span>
            <span className="text-base sm:text-lg font-bold text-caramel">{formatINR(totalStaffFixAmount)}</span>
          </div>
          <div className="bg-expense-red px-4 py-2 rounded-btn text-cream flex items-center gap-2 shadow-warm-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-cream/90">Total Expense:</span>
            <span className="text-lg sm:text-xl font-bold text-cream">{formatINR(totalStaffAmount)}</span>
          </div>
        </div>
      </div>

      {/* Info: staff sync source */}
      <div className="flex items-start gap-2 bg-warm-beige/50 border border-border-warm/60 rounded-btn px-3.5 py-2.5">
        <Info className="w-4 h-4 text-caramel mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-caramel leading-relaxed">
          The staff list and <span className="font-semibold">Fix Amount</span> come from the Staff-app attendance
          system. Here you only fill each member&apos;s <span className="font-semibold text-expense-red">actual monthly amount</span>,
          which is counted in your café expense.
        </p>
      </div>

      {/* Staff-app error banner */}
      {staffError && (
        <div className="flex items-start gap-2 bg-expense-red/10 border border-expense-red/30 rounded-btn px-3.5 py-2.5">
          <AlertTriangle className="w-4 h-4 text-expense-red mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-expense-red font-medium leading-relaxed">{staffError}</p>
        </div>
      )}

      {/* Search */}
      <div className="max-w-lg">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search staff by name..."
          className="flex-1"
        />
      </div>

      {/* Staff List / Table */}
      {filteredStaff.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={
            searchQuery
              ? 'No matching staff found'
              : noBusinessLinked
              ? 'No Staff-app business linked'
              : monthLoading
              ? 'Loading staff…'
              : 'No active staff found'
          }
          description={
            searchQuery
              ? `No staff member matches "${searchQuery}". Try a different name.`
              : noBusinessLinked
              ? 'Set your Staff-app Business ID in Settings to pull your staff roster here.'
              : 'No active staff came back from the Staff-app for this business.'
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStaff.map((staff, idx) => (
              <div
                key={staff.id}
                className="bg-cream p-4 rounded-card border border-border-warm shadow-warm-sm space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-warm-beige text-coffee flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-bold text-coffee">{staff.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border-warm/60 items-center">
                  <div className="bg-warm-beige/40 p-2.5 rounded-btn h-full flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-caramel uppercase tracking-wider block">
                      Fix Amount
                    </span>
                    <span className="text-base font-bold text-caramel mt-0.5">{formatINR(staff.fixAmount)}</span>
                  </div>

                  <div className="bg-cream border border-expense-red/30 p-1.5 rounded-btn focus-within:ring-2 focus-within:ring-expense-red/20 focus-within:border-expense-red transition-all">
                    <span className="text-[10px] font-bold text-expense-red uppercase tracking-wider block px-1">
                      Amount (Counted)
                    </span>
                    <div className="relative flex items-center mt-0.5">
                      <span className="absolute left-1.5 text-sm font-bold text-expense-red select-none">₹</span>
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
                        onKeyDown={e => handleKeyNav(e, idx, mobileInputRefs.current)}
                        className="w-full h-8 pl-5 pr-2 bg-transparent text-base font-bold text-expense-red focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-cream rounded-card border border-border-warm shadow-warm-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-warm-beige/50 text-xs font-bold text-coffee uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Name</th>
                  <th className="py-3.5 px-5">Fix Amount (Ref)</th>
                  <th className="py-3.5 px-5">Amount (Counted)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/60 text-sm">
                {filteredStaff.map((staff, idx) => (
                  <tr key={staff.id} className="hover:bg-warm-beige/30 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-coffee">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-warm-beige text-coffee flex items-center justify-center text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-caramel">{formatINR(staff.fixAmount)}</td>
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
                          onKeyDown={e => handleKeyNav(e, idx, desktopInputRefs.current)}
                          className="w-full h-10 pl-7 pr-3 bg-white border border-border-warm rounded-btn text-sm font-bold text-expense-red placeholder:text-coffee/30 focus:outline-none focus:ring-2 focus:ring-expense-red/20 focus:border-expense-red shadow-sm transition-all"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
