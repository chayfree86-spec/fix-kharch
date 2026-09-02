import React, { useState, useMemo, useRef } from 'react';
import {
  UsersRound,
  User,
  AlertTriangle,
  Info,
  CalendarCheck,
  CreditCard,
  MinusCircle,
  TrendingDown,
} from 'lucide-react';
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
  const totalAdvances = useMemo(
    () => filteredStaff.reduce((sum, s) => sum + (Number(s.advance) || 0), 0),
    [filteredStaff]
  );
  const totalDeductions = useMemo(
    () => filteredStaff.reduce((sum, s) => sum + (Number(s.deduction) || 0), 0),
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
      {/* Header Summary Cards */}
      <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
            <UsersRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-coffee">Staff Kharch</h2>
            <p className="text-xs text-caramel">
              {filteredStaff.length} staff linked from Staff-app · {selectedMonthData.monthName}
            </p>
          </div>
        </div>

        {/* Aggregate Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="bg-warm-beige/60 px-3 py-2 rounded-btn border border-border-warm/60 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-caramel uppercase tracking-wider">Fix Total:</span>
            <span className="text-sm sm:text-base font-bold text-caramel">{formatINR(totalStaffFixAmount)}</span>
          </div>

          {totalAdvances > 0 && (
            <div className="bg-amber-500/10 px-3 py-2 rounded-btn border border-amber-500/20 flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Adv:</span>
              <span className="text-sm font-bold">-{formatINR(totalAdvances)}</span>
            </div>
          )}

          {totalDeductions > 0 && (
            <div className="bg-rose-500/10 px-3 py-2 rounded-btn border border-rose-500/20 flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
              <MinusCircle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Ded:</span>
              <span className="text-sm font-bold">-{formatINR(totalDeductions)}</span>
            </div>
          )}

          <div className="bg-expense-red px-3.5 py-2 rounded-btn text-cream flex items-center gap-2 shadow-warm-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cream/90">Counted Total:</span>
            <span className="text-base sm:text-lg font-bold text-cream">{formatINR(totalStaffAmount)}</span>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 bg-warm-beige/50 border border-border-warm/60 rounded-card px-4 py-3">
        <Info className="w-4 h-4 text-caramel mt-0.5 flex-shrink-0" />
        <p className="text-xs text-caramel leading-relaxed">
          Staff attendance days, advances, and deductions are fetched directly from the Staff-app. Fill each member&apos;s <span className="font-semibold text-expense-red">counted expense amount</span> to be included in your café&apos;s monthly total expense.
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
          {/* Mobile cards view */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStaff.map((staff, idx) => {
              const present = staff.presentDays !== undefined ? staff.presentDays : 0;
              const advance = staff.advance || 0;
              const deduction = staff.deduction || 0;

              return (
                <div
                  key={staff.id}
                  className="bg-cream p-4 rounded-card border border-border-warm shadow-warm-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-warm-beige text-coffee flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-coffee">{staff.name}</h4>
                        {staff.mobile && <p className="text-[11px] text-caramel">{staff.mobile}</p>}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-caramel block">Fix Salary</span>
                      <span className="text-sm font-bold text-caramel">{formatINR(staff.fixAmount)}</span>
                    </div>
                  </div>

                  {/* Attendance & Deductions Badge Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-warm/50 text-xs">
                    <div className="bg-warm-beige/70 px-2.5 py-1 rounded-btn flex items-center gap-1 text-coffee">
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold">{present} Days</span>
                    </div>

                    {advance > 0 && (
                      <div className="bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-btn flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Adv: -{formatINR(advance)}</span>
                      </div>
                    )}

                    {deduction > 0 && (
                      <div className="bg-rose-500/10 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-btn flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Ded: -{formatINR(deduction)}</span>
                      </div>
                    )}
                  </div>

                  {/* Input Row */}
                  <div className="pt-2 border-t border-border-warm/60">
                    <div className="bg-cream border border-expense-red/30 p-1.5 rounded-btn focus-within:ring-2 focus-within:ring-expense-red/20 focus-within:border-expense-red transition-all">
                      <span className="text-[10px] font-bold text-expense-red uppercase tracking-wider block px-1">
                        Amount (Counted in Expense)
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
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-cream rounded-card border border-border-warm shadow-warm-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-warm-beige/50 text-xs font-bold text-coffee uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Name</th>
                  <th className="py-3.5 px-4 text-right">Fix Salary (Ref)</th>
                  <th className="py-3.5 px-4 text-center">Attendance</th>
                  <th className="py-3.5 px-4 text-right">Advance</th>
                  <th className="py-3.5 px-4 text-right">Deduction</th>
                  <th className="py-3.5 px-5 text-right">Amount (Counted)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/60 text-sm">
                {filteredStaff.map((staff, idx) => {
                  const present = staff.presentDays !== undefined ? staff.presentDays : 0;
                  const advance = staff.advance || 0;
                  const deduction = staff.deduction || 0;

                  return (
                    <tr key={staff.id} className="hover:bg-warm-beige/30 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-5 font-bold text-coffee">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-warm-beige text-coffee flex items-center justify-center text-xs flex-shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span>{staff.name}</span>
                            {staff.mobile && (
                              <span className="text-[11px] font-normal text-caramel block">{staff.mobile}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fix Salary */}
                      <td className="py-3.5 px-4 text-right font-bold text-caramel">
                        {formatINR(staff.fixAmount)}
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {present} Days
                        </span>
                      </td>

                      {/* Advance */}
                      <td className="py-3.5 px-4 text-right">
                        {advance > 0 ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            -{formatINR(advance)}
                          </span>
                        ) : (
                          <span className="text-coffee/40">—</span>
                        )}
                      </td>

                      {/* Deduction */}
                      <td className="py-3.5 px-4 text-right">
                        {deduction > 0 ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            -{formatINR(deduction)}
                          </span>
                        ) : (
                          <span className="text-coffee/40">—</span>
                        )}
                      </td>

                      {/* Amount Counted Input */}
                      <td className="py-2.5 px-5 text-right">
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
                            className="w-full h-10 pl-7 pr-3 bg-white border border-border-warm rounded-btn text-sm font-bold text-expense-red text-right placeholder:text-coffee/30 focus:outline-none focus:ring-2 focus:ring-expense-red/20 focus:border-expense-red shadow-sm transition-all"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
