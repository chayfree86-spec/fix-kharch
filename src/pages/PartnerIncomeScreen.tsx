import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HandCoins,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  ReceiptText,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  FileCheck2,
  Calendar,
  Split,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PartnerGroup, PartnerIncomeItem, PartnerIncomeSummary, PaymentMode } from '../types';
import { api, clearStalePartnerLocalData } from '../api/client';
import { formatINR } from '../utils/currency';
import { Modal } from '../components/ui/Modal';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { getMonthName } from '../data/mockData';
import { CustomSelect, Option } from '../components/ui/CustomSelect';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';

const PARTNER_CONFIG = {
  daal_roti: {
    key: 'daal_roti' as PartnerGroup,
    title: 'Daal Roti',
    subtitle: 'Separate account for Daal Roti partners',
    icon: Building2,
    partners: ['Vijender Prajapati', 'Chay Chaupal'],
  },
  chay_chaupal: {
    key: 'chay_chaupal' as PartnerGroup,
    title: 'Chay Chaupal',
    subtitle: 'Separate account for Chay Chaupal partners',
    icon: Users,
    partners: ['Sandeep', 'Narender'],
  },
};

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: React.ElementType }[] = [
  { value: 'Cash', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI / Online', icon: Smartphone },
  { value: 'Bank Transfer', label: 'Bank Transfer / NEFT', icon: Landmark },
  { value: 'Cheque', label: 'Cheque', icon: FileCheck2 },
  { value: 'Other', label: 'Other', icon: CreditCard },
];

export const PartnerIncomeScreen: React.FC = () => {
  const { selectedMonthKey, selectedMonthData } = useApp();

  // Active section tab: 'daal_roti' or 'chay_chaupal'
  const [activeGroup, setActiveGroup] = useState<PartnerGroup>('daal_roti');

  // Purge any stale/mock partner income data from earlier local testing
  useEffect(() => {
    clearStalePartnerLocalData();
  }, []);

  // Server state — purely driven by backend MySQL API
  const [items, setItems] = useState<PartnerIncomeItem[]>([]);
  const [summary, setSummary] = useState<PartnerIncomeSummary>({
    daal_roti: { total: 0, partners: { 'Vijender Prajapati': 0, 'Chay Chaupal': 0 } },
    chay_chaupal: { total: 0, partners: { 'Sandeep': 0, 'Narender': 0 } },
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerIncomeItem | null>(null);

  // Form fields
  const [formTotalAmount, setFormTotalAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>('');
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode>('Cash');
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [formPartner1Amount, setFormPartner1Amount] = useState<number>(0);
  const [formPartner2Amount, setFormPartner2Amount] = useState<number>(0);
  const [formError, setFormError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingDetails, setDeletingDetails] = useState<{ amount: number; group: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data whenever month changes — purely from backend API
  const loadData = useCallback(async (overrideMonth?: string) => {
    const m = overrideMonth ?? selectedMonthKey ?? 'ALL';
    setLoading(true);
    try {
      const res = await api.listPartnerIncome(m);
      setItems(res.items || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load partner income from API:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonthKey]);

  useEffect(() => {
    loadData(selectedMonthKey || 'ALL');
  }, [selectedMonthKey, loadData]);

  // Current section configuration
  const currentConfig = PARTNER_CONFIG[activeGroup];
  const partner1Name = currentConfig.partners[0];
  const partner2Name = currentConfig.partners[1];

  // Filtered items specifically for the active section (completely separate hisab)
  const groupItems = useMemo(() => {
    return items.filter(item => item.partnerGroup === activeGroup);
  }, [items, activeGroup]);

  // Group transactions month-wise with subtotals per month
  const groupedByMonth = useMemo(() => {
    const map = new Map<
      string,
      {
        monthKey: string;
        monthName: string;
        total: number;
        partner1Total: number;
        partner2Total: number;
        items: PartnerIncomeItem[];
      }
    >();

    for (const item of groupItems) {
      const mKey = item.monthKey || (item.incomeDate ? item.incomeDate.substring(0, 7) : 'Unknown');
      if (!map.has(mKey)) {
        map.set(mKey, {
          monthKey: mKey,
          monthName: getMonthName(mKey),
          total: 0,
          partner1Total: 0,
          partner2Total: 0,
          items: [],
        });
      }
      const g = map.get(mKey)!;
      g.total += item.totalAmount;
      g.partner1Total += item.partner1Amount;
      g.partner2Total += item.partner2Amount;
      g.items.push(item);
    }

    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [groupItems]);

  // Active section summary & Advance calculations
  const groupTotals = useMemo(() => {
    let total = 0;
    let p1 = 0;
    let p2 = 0;
    for (const item of groupItems) {
      total += item.totalAmount;
      p1 += item.partner1Amount;
      p2 += item.partner2Amount;
    }
    return { total, p1, p2 };
  }, [groupItems]);

  const allGroupTotals = useMemo(() => {
    let dr = 0;
    let cc = 0;
    for (const item of items) {
      if (item.partnerGroup === 'daal_roti') dr += item.totalAmount;
      else if (item.partnerGroup === 'chay_chaupal') cc += item.totalAmount;
    }
    return { daal_roti: dr, chay_chaupal: cc };
  }, [items]);

  const totalIncome = groupItems.length > 0 ? groupTotals.total : (summary[activeGroup]?.total || 0);
  const p1Total = groupItems.length > 0 ? groupTotals.p1 : (summary[activeGroup]?.partners[partner1Name] || 0);
  const p2Total = groupItems.length > 0 ? groupTotals.p2 : (summary[activeGroup]?.partners[partner2Name] || 0);
  const expectedEach = Math.round(totalIncome / 2);
  const p1Diff = p1Total - expectedEach; // > 0 means took advance/extra
  const p2Diff = p2Total - expectedEach; // > 0 means took advance/extra

  // When total amount changes in modal, auto-update 50-50 split
  const handleTotalAmountChange = (amount: number) => {
    setFormTotalAmount(amount);
    const half = Math.floor(amount / 2);
    setFormPartner1Amount(half);
    setFormPartner2Amount(amount - half);
  };

  // When partner 1 amount is edited, auto-balance partner 2
  const handlePartner1AmountChange = (val: number) => {
    const v = Math.max(0, val);
    setFormPartner1Amount(v);
    setFormPartner2Amount(Math.max(0, formTotalAmount - v));
  };

  // When partner 2 amount is edited, auto-balance partner 1
  const handlePartner2AmountChange = (val: number) => {
    const v = Math.max(0, val);
    setFormPartner2Amount(v);
    setFormPartner1Amount(Math.max(0, formTotalAmount - v));
  };

  // Reset to equal 50-50 split
  const handleResetToFiftyFifty = () => {
    const half = Math.floor(formTotalAmount / 2);
    setFormPartner1Amount(half);
    setFormPartner2Amount(formTotalAmount - half);
  };

  // Open Add modal with defaults for active section (or specified section)
  const handleOpenAdd = (group?: PartnerGroup) => {
    if (group && group !== activeGroup) {
      setActiveGroup(group);
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    setEditingItem(null);
    setFormTotalAmount(0);
    setFormPartner1Amount(0);
    setFormPartner2Amount(0);
    setFormDate(todayStr); // Always default to current date
    setFormPaymentMode('Cash');
    setFormRemarks('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: PartnerIncomeItem) => {
    setEditingItem(item);
    setFormTotalAmount(item.totalAmount);
    setFormPartner1Amount(item.partner1Amount);
    setFormPartner2Amount(item.partner2Amount);
    setFormDate(item.incomeDate);
    setFormPaymentMode(item.paymentMode as PaymentMode);
    setFormRemarks(item.remarks || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTotalAmount || formTotalAmount <= 0) {
      setFormError('Please enter an income amount greater than ₹0');
      return;
    }
    if (!formDate) {
      setFormError('Please select a date');
      return;
    }

    const sumSplit = formPartner1Amount + formPartner2Amount;
    if (sumSplit !== formTotalAmount) {
      setFormError(
        `Partner distribution total (${formatINR(sumSplit)}) must equal total income (${formatINR(formTotalAmount)})`
      );
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const entryMonth = formDate
        ? formDate.substring(0, 7)
        : (selectedMonthKey !== 'ALL' ? selectedMonthKey : new Date().toISOString().substring(0, 7));

      if (editingItem) {
        await api.updatePartnerIncome({
          id: editingItem.id,
          month: entryMonth,
          partnerGroup: activeGroup,
          totalAmount: formTotalAmount,
          incomeDate: formDate,
          paymentMode: formPaymentMode,
          remarks: formRemarks.trim() || null,
          partner1Name,
          partner1Amount: formPartner1Amount,
          partner2Name,
          partner2Amount: formPartner2Amount,
        });
      } else {
        await api.addPartnerIncome({
          month: entryMonth,
          partnerGroup: activeGroup,
          totalAmount: formTotalAmount,
          incomeDate: formDate,
          paymentMode: formPaymentMode,
          remarks: formRemarks.trim() || null,
          partner1Name,
          partner1Amount: formPartner1Amount,
          partner2Name,
          partner2Amount: formPartner2Amount,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save income record');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.deletePartnerIncome(deletingId);
      setDeletingId(null);
      setDeletingDetails(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete income record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date display: "02 Oct 2026"
  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${monthNames[mIdx]} ${parts[0]}`;
      }
    } catch {}
    return dateStr;
  };

  // Payment mode options
  const paymentModeOptions: Option[] = PAYMENT_MODES.map(pm => ({
    value: pm.value,
    label: pm.label,
    icon: pm.icon,
  }));

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-12 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-warm-sm">
              <HandCoins className="w-5 h-5 text-cream" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-coffee">Partner Income</h1>
              <p className="text-xs sm:text-sm text-caramel">
                Separate monthly accounting &amp; distribution for Daal Roti &amp; Chay Chaupal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs (Daal Roti vs Chay Chaupal) with Separate Add Income Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-warm-beige/40 rounded-card border border-border-warm">
        {/* Daal Roti Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveGroup('daal_roti')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveGroup('daal_roti');
            }
          }}
          className={`flex items-center justify-between p-3 sm:p-4 rounded-btn transition-all text-left cursor-pointer select-none ${
            activeGroup === 'daal_roti'
              ? 'bg-coffee text-cream shadow-warm-md scale-[1.01]'
              : 'bg-cream text-coffee hover:bg-warm-beige/60 border border-border-warm/60'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activeGroup === 'daal_roti' ? 'bg-cream/20 text-cream' : 'bg-warm-beige text-coffee'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm sm:text-base truncate">Daal Roti</div>
              <div
                className={`text-xs truncate ${
                  activeGroup === 'daal_roti' ? 'text-cream/80' : 'text-caramel'
                }`}
              >
                Vijender Prajapati • Chay Chaupal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
            <div className="text-right">
              <div
                className={`text-[10px] sm:text-xs uppercase tracking-wider font-semibold ${
                  activeGroup === 'daal_roti' ? 'text-cream/70' : 'text-caramel'
                }`}
              >
                Total Income
              </div>
              <div className={`text-sm sm:text-base font-bold ${
                activeGroup === 'daal_roti' ? 'text-income-green-light' : 'text-income-green'
              }`}>
                {formatINR(allGroupTotals.daal_roti || summary.daal_roti.total)}
              </div>
            </div>

            {/* Separate Add Income Button for Daal Roti */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAdd('daal_roti');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-btn font-bold text-xs transition-all shadow-warm-xs flex-shrink-0 active:scale-95 ${
                activeGroup === 'daal_roti'
                  ? 'bg-cream text-coffee hover:bg-white'
                  : 'bg-coffee text-cream hover:bg-coffee/90'
              }`}
              title="Add Daal Roti Income"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Income</span>
            </button>
          </div>
        </div>

        {/* Chay Chaupal Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveGroup('chay_chaupal')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveGroup('chay_chaupal');
            }
          }}
          className={`flex items-center justify-between p-3 sm:p-4 rounded-btn transition-all text-left cursor-pointer select-none ${
            activeGroup === 'chay_chaupal'
              ? 'bg-coffee text-cream shadow-warm-md scale-[1.01]'
              : 'bg-cream text-coffee hover:bg-warm-beige/60 border border-border-warm/60'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activeGroup === 'chay_chaupal' ? 'bg-cream/20 text-cream' : 'bg-warm-beige text-coffee'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm sm:text-base truncate">Chay Chaupal</div>
              <div
                className={`text-xs truncate ${
                  activeGroup === 'chay_chaupal' ? 'text-cream/80' : 'text-caramel'
                }`}
              >
                Sandeep • Narender
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
            <div className="text-right">
              <div
                className={`text-[10px] sm:text-xs uppercase tracking-wider font-semibold ${
                  activeGroup === 'chay_chaupal' ? 'text-cream/70' : 'text-caramel'
                }`}
              >
                Total Income
              </div>
              <div className={`text-sm sm:text-base font-bold ${
                activeGroup === 'chay_chaupal' ? 'text-income-green-light' : 'text-income-green'
              }`}>
                {formatINR(allGroupTotals.chay_chaupal || summary.chay_chaupal.total)}
              </div>
            </div>

            {/* Separate Add Income Button for Chay Chaupal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAdd('chay_chaupal');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-btn font-bold text-xs transition-all shadow-warm-xs flex-shrink-0 active:scale-95 ${
                activeGroup === 'chay_chaupal'
                  ? 'bg-cream text-coffee hover:bg-white'
                  : 'bg-coffee text-cream hover:bg-coffee/90'
              }`}
              title="Add Chay Chaupal Income"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Income</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Section Overview & Partner Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-coffee uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-coffee inline-block" />
            {currentConfig.title} — Income &amp; Partner Distribution
          </h2>
          <span className="text-xs text-caramel font-medium">{selectedMonthData.monthName}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Section Total */}
          <div className="bg-cream border border-border-warm rounded-card p-4 sm:p-5 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-caramel font-semibold mb-2">
              <span>{currentConfig.title} Total Income</span>
              <HandCoins className="w-4 h-4 text-income-green" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-income-green">
              {formatINR(totalIncome)}
            </div>
            <div className="text-xs text-caramel/90 mt-2 font-medium">
              {groupItems.length} income record{groupItems.length === 1 ? '' : 's'} {selectedMonthKey === 'ALL' ? '(All Time)' : `in ${selectedMonthData.monthName}`}
            </div>
          </div>

          {/* Card 2: Partner 1 Distribution & Advance */}
          <div className="bg-cream border border-border-warm rounded-card p-4 sm:p-5 shadow-warm-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-caramel mb-2">
                <span className="truncate">{partner1Name}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  p1Diff > 0
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-income-green-50 text-income-green border border-income-green/20'
                }`}>
                  {totalIncome > 0 ? Math.round((p1Total / totalIncome) * 100) : 50}% Taken
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-income-green">
                {formatINR(p1Total)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {p1Diff > 0 ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    +{formatINR(p1Diff)} Advance Taken
                  </span>
                ) : p1Diff < 0 ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-warm-beige/60 text-caramel">
                    {formatINR(Math.abs(p1Diff))} Receivable
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-caramel/90">
                    Expected 50%: {formatINR(expectedEach)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-caramel/90 mt-2 font-medium">
              <span>Distributed Share</span>
              <div className="w-24 bg-warm-beige rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-income-green h-full rounded-full transition-all"
                  style={{
                    width: `${
                      totalIncome > 0
                        ? Math.min(100, Math.round((p1Total / totalIncome) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Partner 2 Distribution & Advance */}
          <div className="bg-cream border border-border-warm rounded-card p-4 sm:p-5 shadow-warm-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-caramel mb-2">
                <span className="truncate">{partner2Name}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  p2Diff > 0
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-income-green-50 text-income-green border border-income-green/20'
                }`}>
                  {totalIncome > 0 ? Math.round((p2Total / totalIncome) * 100) : 50}% Taken
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-income-green">
                {formatINR(p2Total)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {p2Diff > 0 ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    +{formatINR(p2Diff)} Advance Taken
                  </span>
                ) : p2Diff < 0 ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-warm-beige/60 text-caramel">
                    {formatINR(Math.abs(p2Diff))} Receivable
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-caramel/90">
                    Expected 50%: {formatINR(expectedEach)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-caramel/90 mt-2 font-medium">
              <span>Distributed Share</span>
              <div className="w-24 bg-warm-beige rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-income-green h-full rounded-full transition-all"
                  style={{
                    width: `${
                      totalIncome > 0
                        ? Math.min(100, Math.round((p2Total / totalIncome) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Records List / Table */}
      {loading ? (
        <div className="bg-cream border border-border-warm rounded-card shadow-warm-sm p-12 text-center text-sm font-semibold text-caramel">
          Loading partner records…
        </div>
      ) : groupItems.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={`No income records for ${currentConfig.title}`}
          description={`Add the first income entry for ${currentConfig.title} in ${selectedMonthData.monthName}. It will automatically distribute 50-50 between ${partner1Name} and ${partner2Name}.`}
          actionText={`Add ${currentConfig.title} Income`}
          actionVariant="primary"
          onAction={() => handleOpenAdd(activeGroup)}
        />
      ) : (
        <div className="space-y-4">
          {groupedByMonth.map(mGroup => (
            <div
              key={mGroup.monthKey}
              className="bg-cream border border-border-warm rounded-card shadow-warm-sm overflow-hidden"
            >
              {/* Month Group Header */}
              <div className="px-4 py-2.5 bg-warm-beige/35 border-b border-border-warm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-coffee/10 text-coffee flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-coffee" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-coffee">{mGroup.monthName}</span>
                  <span className="text-[11px] text-caramel">
                    ({mGroup.items.length} {mGroup.items.length === 1 ? 'record' : 'records'})
                  </span>
                </div>

                <span className="text-xs font-bold text-income-green px-2.5 py-0.5 rounded-full bg-income-green-50 dark:bg-income-green-50/20 border border-income-green/30">
                  Month Total: {formatINR(mGroup.total)}
                </span>
              </div>

              {/* Transactions in this month */}
              <div className="divide-y divide-border-warm/60">
                {mGroup.items.map(item => {
                  const ModeIcon =
                    PAYMENT_MODES.find(m => m.value === item.paymentMode)?.icon || CreditCard;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-warm-beige/20 transition-colors"
                    >
                      {/* Left Column: Icon & Basic Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-income-green-50 dark:bg-income-green-50/20 text-income-green flex items-center justify-center flex-shrink-0 mt-0.5 border border-income-green/20">
                          <ReceiptText className="w-5 h-5 text-income-green" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base text-income-green">
                              +{formatINR(item.totalAmount)}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warm-beige/70 text-coffee/90 flex items-center gap-1">
                              <ModeIcon className="w-3 h-3 text-caramel" />
                              {item.paymentMode}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-caramel mt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-caramel" />
                              {formatDateDisplay(item.incomeDate)}
                            </span>
                            {item.remarks && (
                              <span className="truncate max-w-[200px] sm:max-w-md text-coffee/70">
                                • {item.remarks}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Column: Partner Distribution Split */}
                      <div className="flex items-center gap-2 py-2 px-3 bg-warm-beige/40 rounded-btn border border-border-warm/50 text-xs self-stretch md:self-auto justify-between md:justify-start">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-caramel">{item.partner1Name}:</span>
                          <span className="font-bold text-income-green">{formatINR(item.partner1Amount)}</span>
                        </div>
                        <span className="text-caramel/40">|</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-caramel">{item.partner2Name}:</span>
                          <span className="font-bold text-income-green">{formatINR(item.partner2Amount)}</span>
                        </div>
                      </div>

                      {/* Right Column: Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="w-8 h-8 rounded-btn flex items-center justify-center text-caramel hover:text-coffee hover:bg-warm-beige/60 transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingId(item.id);
                            setDeletingDetails({ amount: item.totalAmount, group: currentConfig.title });
                          }}
                          className="w-8 h-8 rounded-btn flex items-center justify-center text-caramel hover:text-expense-red hover:bg-expense-red/10 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Income Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingItem ? `Edit ${currentConfig.title} Income` : `Add ${currentConfig.title} Income`}
        subtitle={`${currentConfig.title} — ${selectedMonthData.monthName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="p-2.5 bg-expense-red/10 border border-expense-red/20 rounded-btn text-xs font-semibold text-expense-red">
              {formError}
            </div>
          )}

          {/* Total Income Amount */}
          <div>
            <CurrencyInput
              label={`Total ${currentConfig.title} Income Amount (₹)`}
              value={formTotalAmount}
              onChange={handleTotalAmountChange}
              placeholder="0"
              autoFocus
            />
          </div>

          {/* Partner Distribution Card with Auto 50-50 & Direct Amount Inputs */}
          <div className="p-3 bg-warm-beige/50 rounded-card border border-border-warm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-coffee">
              <span className="flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5 text-caramel" />
                Partner Distribution (Auto 50% - 50% or Custom)
              </span>
              <span className="text-[11px] font-normal text-caramel">
                Total: {formatINR(formTotalAmount)}
              </span>
            </div>

            {/* Quick Presets: 50-50 or Took All */}
            {formTotalAmount > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-caramel">Quick:</span>
                <button
                  type="button"
                  onClick={handleResetToFiftyFifty}
                  className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:py-1 rounded-full border transition-all ${
                    formPartner1Amount === Math.floor(formTotalAmount / 2) && formPartner2Amount === formTotalAmount - Math.floor(formTotalAmount / 2)
                      ? 'bg-coffee text-cream border-coffee shadow-warm-sm'
                      : 'bg-cream text-coffee hover:bg-warm-beige border-border-warm'
                  }`}
                >
                  ⚖️ 50-50 Split
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormPartner1Amount(formTotalAmount);
                    setFormPartner2Amount(0);
                  }}
                  className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:py-1 rounded-full border transition-all ${
                    formPartner1Amount === formTotalAmount && formTotalAmount > 0
                      ? 'bg-coffee text-cream border-coffee shadow-warm-sm'
                      : 'bg-cream text-coffee hover:bg-warm-beige border-border-warm'
                  }`}
                >
                  {partner1Name} took all
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormPartner1Amount(0);
                    setFormPartner2Amount(formTotalAmount);
                  }}
                  className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:py-1 rounded-full border transition-all ${
                    formPartner2Amount === formTotalAmount && formTotalAmount > 0
                      ? 'bg-coffee text-cream border-coffee shadow-warm-sm'
                      : 'bg-cream text-coffee hover:bg-warm-beige border-border-warm'
                  }`}
                >
                  {partner2Name} took all
                </button>
              </div>
            )}

            {/* Partner 1 & Partner 2 Direct Amount Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Partner 1 */}
              <div className="bg-cream p-2.5 rounded-btn border border-border-warm/70 space-y-1">
                <div className="text-xs font-semibold text-coffee truncate">
                  {partner1Name}
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-caramel">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={formTotalAmount || undefined}
                    value={formPartner1Amount || ''}
                    onChange={e => handlePartner1AmountChange(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-1 bg-warm-beige/30 border border-border-warm rounded text-sm sm:text-base font-bold text-income-green focus:outline-none focus:ring-1 focus:ring-coffee/20"
                  />
                </div>
                <div className="text-[10px] text-caramel font-medium flex items-center justify-between">
                  <span>
                    {formTotalAmount > 0
                      ? Math.round((formPartner1Amount / formTotalAmount) * 100)
                      : 50}% share
                  </span>
                  {formTotalAmount > 0 && formPartner1Amount > Math.floor(formTotalAmount / 2) && (
                    <span className="text-amber-700 dark:text-amber-400 font-bold">
                      +{formatINR(formPartner1Amount - Math.floor(formTotalAmount / 2))} Extra
                    </span>
                  )}
                </div>
              </div>

              {/* Partner 2 */}
              <div className="bg-cream p-2.5 rounded-btn border border-border-warm/70 space-y-1">
                <div className="text-xs font-semibold text-coffee truncate">
                  {partner2Name}
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-caramel">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={formTotalAmount || undefined}
                    value={formPartner2Amount || ''}
                    onChange={e => handlePartner2AmountChange(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-1 bg-warm-beige/30 border border-border-warm rounded text-sm sm:text-base font-bold text-income-green focus:outline-none focus:ring-1 focus:ring-coffee/20"
                  />
                </div>
                <div className="text-[10px] text-caramel font-medium flex items-center justify-between">
                  <span>
                    {formTotalAmount > 0
                      ? Math.round((formPartner2Amount / formTotalAmount) * 100)
                      : 50}% share
                  </span>
                  {formTotalAmount > 0 && formPartner2Amount > Math.floor(formTotalAmount / 2) && (
                    <span className="text-amber-700 dark:text-amber-400 font-bold">
                      +{formatINR(formPartner2Amount - Math.floor(formTotalAmount / 2))} Extra
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Date Picker & Payment Mode in 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <CustomDatePicker
              label="Income Received Date"
              value={formDate}
              onChange={val => setFormDate(val)}
            />
            <CustomSelect
              label="Payment Mode"
              value={formPaymentMode}
              options={paymentModeOptions}
              onChange={val => setFormPaymentMode(val as PaymentMode)}
              placeholder="Select payment mode"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-coffee/80 mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={formRemarks}
              onChange={e => setFormRemarks(e.target.value)}
              placeholder="e.g. Weekly counter cash, online payout settlement..."
              className="w-full px-3 py-2 bg-cream border border-border-warm rounded-btn text-xs sm:text-sm text-coffee placeholder-caramel/60 focus:outline-none focus:ring-2 focus:ring-coffee/20 transition-all shadow-warm-sm"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-border-warm/60">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="px-4 py-2 rounded-btn text-xs sm:text-sm font-semibold text-coffee/80 hover:bg-warm-beige/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-btn bg-coffee hover:bg-coffee/90 text-cream text-xs sm:text-sm font-semibold shadow-warm-sm transition-all disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : editingItem ? 'Save Changes' : 'Add Income'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => !isDeleting && setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Income Record?"
        message={
          deletingDetails
            ? `Are you sure you want to delete this income entry of ${formatINR(
                deletingDetails.amount
              )} for ${deletingDetails.group}? The distributed partner amounts will also be removed.`
            : 'Are you sure you want to delete this income entry?'
        }
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        isDestructive
      />
    </div>
  );
};
