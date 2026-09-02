import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  StaffItem,
  EMIItem,
  ShopExpenseItem,
  OtherExpenseItem,
  GenericExpenseItem,
  ExpenseCategory,
  MonthData,
  CafeSettings,
  TabType,
} from '../types';
import { getCurrentMonthKey, createEmptyMonth, addMonthsToKey } from '../data/mockData';
import { calculateMonthSummary, MonthSummary } from '../utils/calculations';
import { api, ApiUser, ApiExpenseItem, ApiStaffItem, BootstrapData, AuthResponse } from '../api/client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AppContextType {
  // Auth
  authStatus: AuthStatus;
  user: ApiUser | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email?: string;
    mobile?: string;
    password: string;
    cafeName?: string;
    businessId?: number | string;
  }) => Promise<void>;
  logout: () => Promise<void>;

  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  selectedMonthKey: string;
  selectedMonthData: MonthData;
  availableMonthKeys: string[];
  summary: MonthSummary;
  monthLoading: boolean;
  staffError: string | null;
  settings: CafeSettings;
  updateSettings: (newSettings: Partial<CafeSettings>) => void;
  setMonth: (monthKey: string) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  // Categories CRUD & Control
  categories: ExpenseCategory[];
  addCategory: (category: Omit<ExpenseCategory, 'id' | 'isDefault' | 'order'>) => void;
  updateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  deleteCategory: (id: string) => void;
  toggleCategory: (id: string) => void;
  // Staff (roster comes from Staff-app; only the monthly amount is editable)
  addStaff: (item: Omit<StaffItem, 'id'>) => void;
  updateStaff: (id: string, item: Partial<StaffItem>) => void;
  deleteStaff: (id: string) => void;
  // EMI CRUD
  addEMI: (item: Omit<EMIItem, 'id'>) => void;
  updateEMI: (id: string, item: Partial<EMIItem>) => void;
  deleteEMI: (id: string) => void;
  // Shop Expense CRUD
  addShopExpense: (item: Omit<ShopExpenseItem, 'id'>) => void;
  updateShopExpense: (id: string, item: Partial<ShopExpenseItem>) => void;
  deleteShopExpense: (id: string) => void;
  // Other Expense CRUD
  addOtherExpense: (item: Omit<OtherExpenseItem, 'id'>) => void;
  updateOtherExpense: (id: string, item: Partial<OtherExpenseItem>) => void;
  deleteOtherExpense: (id: string) => void;
  // Custom Category Expenses CRUD
  addCustomExpense: (categoryId: string, item: Omit<GenericExpenseItem, 'id'>) => void;
  updateCustomExpense: (categoryId: string, itemId: string, item: Partial<GenericExpenseItem>) => void;
  deleteCustomExpense: (categoryId: string, itemId: string) => void;
  // Budget
  updateBudget: (budget: number) => void;
  // Reload data from server (used by Settings "reset")
  resetToDefaults: () => void;
  // Global quick action modal trigger
  quickActionType: string | null;
  setQuickActionType: (type: string | null) => void;
}

const STORAGE_KEY_MONTH = 'fix_spend_active_month';
const STORAGE_KEY_CACHED_MONTHS = 'fix_spend_cached_months_v1';

// Cross-tab real-time sync channel
const syncBus = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('fix_spend_sync_bus')
  : null;

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: CafeSettings = {
  cafeName: 'My Café',
  tagline: 'Manage Fixed Expenses. Grow Your Café.',
  defaultMonthlyBudget: 0,
  currencySymbol: '₹',
  staffBusinessId: null,
};

// ---- Helpers to turn API payloads into the app's MonthData shape ----

function toGenericItem(it: ApiExpenseItem): GenericExpenseItem {
  return { id: it.id, name: it.name, amount: it.amount, notes: it.notes ?? undefined };
}

function assembleMonth(
  monthKey: string,
  budget: number,
  items: ApiExpenseItem[],
  staff: ApiStaffItem[]
): MonthData {
  const month = createEmptyMonth(monthKey, budget);
  const custom: Record<string, GenericExpenseItem[]> = {};

  for (const it of items) {
    const item = toGenericItem(it);
    if (it.category === 'emi') month.emiList.push(item);
    else if (it.category === 'shop') month.shopExpenses.push(item);
    else if (it.category === 'other') month.otherExpenses.push(item);
    else (custom[it.category] ||= []).push(item);
  }
  month.customExpenses = custom;
  month.staffList = staff.map(s => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    fixAmount: s.fixAmount,
    mobile: s.mobile,
    perDaySalary: s.perDaySalary,
    presentDays: s.presentDays,
    absentDays: s.absentDays,
    advance: s.advance,
    deduction: s.deduction,
    earnedSalary: s.earnedSalary,
    netPayable: s.netPayable,
  }));
  return month;
}

// Apply a transform to whichever bucket a category maps to.
function mapBucket(
  m: MonthData,
  category: string,
  fn: (arr: GenericExpenseItem[]) => GenericExpenseItem[]
): MonthData {
  if (category === 'emi') return { ...m, emiList: fn(m.emiList as any) as any };
  if (category === 'shop') return { ...m, shopExpenses: fn(m.shopExpenses as any) as any };
  if (category === 'other') return { ...m, otherExpenses: fn(m.otherExpenses as any) as any };
  const custom = m.customExpenses || {};
  return { ...m, customExpenses: { ...custom, [category]: fn(custom[category] || []) } };
}

const isTemp = (id: string) => id.startsWith('tmp-');
const tempId = () => 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<ApiUser | null>(null);

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [quickActionType, setQuickActionType] = useState<string | null>(null);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_SETTINGS);

  // Stale-While-Revalidate: load immediately from local cache so app opens in < 50ms on slow 2G/3G networks
  const [monthsData, setMonthsData] = useState<Record<string, MonthData>>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CACHED_MONTHS);
      if (cached) return JSON.parse(cached);
    } catch {
      /* ignore */
    }
    return {};
  });

  const [monthLoading, setMonthLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MONTH);
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    } catch {
      /* ignore */
    }
    return getCurrentMonthKey();
  });

  // Refs so async callbacks read the latest state without re-subscribing.
  const monthsDataRef = useRef(monthsData);
  monthsDataRef.current = monthsData;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const staffTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Persist the selected month (convenience only, not sensitive).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MONTH, selectedMonthKey);
    } catch {
      /* ignore */
    }
  }, [selectedMonthKey]);

  const applyBootstrap = useCallback((data: BootstrapData) => {
    setSettings({
      cafeName: data.settings.cafeName,
      tagline: data.settings.tagline,
      currencySymbol: data.settings.currencySymbol,
      defaultMonthlyBudget: data.settings.defaultMonthlyBudget,
      staffBusinessId: data.settings.staffBusinessId,
    });
    setCategories(data.categories as ExpenseCategory[]);
  }, []);

  const applyAuth = useCallback(
    (res: AuthResponse) => {
      setUser(res.user);
      applyBootstrap(res.data);
      setAuthStatus('authenticated');
    },
    [applyBootstrap]
  );

  // On first load, check for an existing session.
  useEffect(() => {
    api
      .me()
      .then(applyAuth)
      .catch(() => setAuthStatus('unauthenticated'));
  }, [applyAuth]);

  // Load a month's data (budget + expenses + staff) from the API.
  const loadMonth = useCallback(async (monthKey: string, silent: boolean = false) => {
    // If silent (background sync) or already cached, do not lock UI with full screen loader
    if (!silent && !monthsDataRef.current[monthKey]) {
      setMonthLoading(true);
    }
    setStaffError(null);
    try {
      const [budgetRes, expensesRes] = await Promise.all([
        api.getBudget(monthKey),
        api.listExpenses(monthKey),
      ]);

      // Staff comes from the Staff-app; tolerate it being unavailable.
      let staff: ApiStaffItem[] = [];
      try {
        const staffRes = await api.listStaff(monthKey);
        staff = staffRes.staff;
        if (staffRes.message) setStaffError(staffRes.message);
      } catch (e: any) {
        setStaffError(e?.message || 'Could not load staff from Staff-app.');
      }

      const month = assembleMonth(monthKey, budgetRes.budget, expensesRes.items, staff);
      setMonthsData(prev => {
        const next = { ...prev, [monthKey]: month };
        try {
          localStorage.setItem(STORAGE_KEY_CACHED_MONTHS, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    } finally {
      if (!silent) {
        setMonthLoading(false);
      }
    }
  }, []);

  // Whenever the active month changes (and we're logged in), fetch it.
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    loadMonth(selectedMonthKey);
  }, [authStatus, selectedMonthKey, loadMonth]);

  // Real-time Multi-Device Sync Engine: Focus, Visibility & Background Polling
  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    // 1. Instant sync when tab/app gains focus or user switches back to browser tab
    const handleActiveSync = () => {
      if (document.visibilityState === 'visible') {
        loadMonth(selectedMonthKey, true);
      }
    };

    window.addEventListener('focus', handleActiveSync);
    document.addEventListener('visibilitychange', handleActiveSync);

    // 2. Cross-tab instant notification listener (0ms latency cross-tab)
    if (syncBus) {
      syncBus.onmessage = (ev: MessageEvent) => {
        if (ev.data?.type === 'MUTATION') {
          loadMonth(selectedMonthKey, true);
        }
      };
    }

    // 3. Fast multi-device background polling loop (every 7 seconds when active)
    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !document.hidden) {
        loadMonth(selectedMonthKey, true);
      }
    }, 7000);

    return () => {
      window.removeEventListener('focus', handleActiveSync);
      document.removeEventListener('visibilitychange', handleActiveSync);
      clearInterval(pollTimer);
    };
  }, [authStatus, selectedMonthKey, loadMonth]);

  // ---- Auth actions ----
  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await api.login(identifier, password);
      applyAuth(res);
    },
    [applyAuth]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email?: string;
      mobile?: string;
      password: string;
      cafeName?: string;
      businessId?: number | string;
    }) => {
      const res = await api.register(payload);
      applyAuth(res);
    },
    [applyAuth]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore network errors on logout */
    }
    setUser(null);
    setMonthsData({});
    setCategories([]);
    setSettings(DEFAULT_SETTINGS);
    setCurrentTab('dashboard');
    setAuthStatus('unauthenticated');
  }, []);

  const resetToDefaults = useCallback(() => {
    // No destructive server reset — just reload fresh data from the server.
    api
      .me()
      .then(res => {
        applyBootstrap(res.data);
        loadMonth(selectedMonthKey);
      })
      .catch(() => setAuthStatus('unauthenticated'));
  }, [applyBootstrap, loadMonth, selectedMonthKey]);

  // ---- Derived ----
  const availableMonthKeys = Object.keys(monthsData).sort();
  const selectedMonthData: MonthData =
    monthsData[selectedMonthKey] || createEmptyMonth(selectedMonthKey, settings.defaultMonthlyBudget);
  const summary = calculateMonthSummary(selectedMonthData, categories);

  // ---- Month navigation ----
  const setMonth = (monthKey: string) => setSelectedMonthKey(monthKey);
  const nextMonth = () => setSelectedMonthKey(addMonthsToKey(selectedMonthKey, 1));
  const prevMonth = () => setSelectedMonthKey(addMonthsToKey(selectedMonthKey, -1));

  // ---- Settings ----
  const updateSettings = (patch: Partial<CafeSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
    api.updateSettings(patch).catch(err => console.error('Failed to save settings', err));
  };

  const updateBudget = (budget: number) => {
    const month = selectedMonthKey;
    setMonthsData(prev => {
      const cur = prev[month] || createEmptyMonth(month, settingsRef.current.defaultMonthlyBudget);
      return { ...prev, [month]: { ...cur, budget } };
    });
    api.setBudget(month, budget).catch(err => console.error('Failed to save budget', err));
  };

  // ---- Generic expense-item mutations (emi / shop / other / custom) ----
  const patchMonth = (monthKey: string, updater: (m: MonthData) => MonthData) => {
    setMonthsData(prev => {
      const cur = prev[monthKey] || createEmptyMonth(monthKey, settingsRef.current.defaultMonthlyBudget);
      return { ...prev, [monthKey]: updater(cur) };
    });
  };

  const addExpenseItem = (category: string, item: Omit<GenericExpenseItem, 'id'>) => {
    const month = selectedMonthKey;
    const temp = tempId();
    patchMonth(month, m => mapBucket(m, category, arr => [...arr, { ...item, id: temp }]));

    api
      .addExpense({ month, category, name: item.name, amount: item.amount, notes: item.notes ?? null })
      .then(res => {
        patchMonth(month, m =>
          mapBucket(m, category, arr => arr.map(i => (i.id === temp ? { ...i, id: res.item.id } : i)))
        );
        syncBus?.postMessage({ type: 'MUTATION', monthKey: month });
      })
      .catch(err => {
        console.error('Failed to add expense', err);
        patchMonth(month, m => mapBucket(m, category, arr => arr.filter(i => i.id !== temp)));
      });
  };

  const updateExpenseItem = (category: string, id: string, patch: Partial<GenericExpenseItem>) => {
    const month = selectedMonthKey;
    patchMonth(month, m => mapBucket(m, category, arr => arr.map(i => (i.id === id ? { ...i, ...patch } : i))));
    if (!isTemp(id)) {
      api
        .updateExpense({ id, name: patch.name, amount: patch.amount, notes: patch.notes })
        .then(() => syncBus?.postMessage({ type: 'MUTATION', monthKey: month }))
        .catch(err => console.error('Failed to update expense', err));
    }
  };

  const deleteExpenseItem = (category: string, id: string) => {
    const month = selectedMonthKey;
    patchMonth(month, m => mapBucket(m, category, arr => arr.filter(i => i.id !== id)));
    if (!isTemp(id)) {
      api
        .deleteExpense(id)
        .then(() => syncBus?.postMessage({ type: 'MUTATION', monthKey: month }))
        .catch(err => console.error('Failed to delete expense', err));
    }
  };

  // ---- Category-specific wrappers ----
  const addEMI = (item: Omit<EMIItem, 'id'>) => addExpenseItem('emi', item);
  const updateEMI = (id: string, item: Partial<EMIItem>) => updateExpenseItem('emi', id, item);
  const deleteEMI = (id: string) => deleteExpenseItem('emi', id);

  const addShopExpense = (item: Omit<ShopExpenseItem, 'id'>) => addExpenseItem('shop', item);
  const updateShopExpense = (id: string, item: Partial<ShopExpenseItem>) => updateExpenseItem('shop', id, item);
  const deleteShopExpense = (id: string) => deleteExpenseItem('shop', id);

  const addOtherExpense = (item: Omit<OtherExpenseItem, 'id'>) => addExpenseItem('other', item);
  const updateOtherExpense = (id: string, item: Partial<OtherExpenseItem>) => updateExpenseItem('other', id, item);
  const deleteOtherExpense = (id: string) => deleteExpenseItem('other', id);

  const addCustomExpense = (categoryId: string, item: Omit<GenericExpenseItem, 'id'>) =>
    addExpenseItem(categoryId, item);
  const updateCustomExpense = (categoryId: string, itemId: string, item: Partial<GenericExpenseItem>) =>
    updateExpenseItem(categoryId, itemId, item);
  const deleteCustomExpense = (categoryId: string, itemId: string) => deleteExpenseItem(categoryId, itemId);

  // ---- Staff (only the monthly amount is editable; roster is read-only) ----
  const addStaff = (_item: Omit<StaffItem, 'id'>) => {
    console.warn('Staff are managed in the Staff-app and cannot be added here.');
  };
  const deleteStaff = (_id: string) => {
    console.warn('Staff are managed in the Staff-app and cannot be deleted here.');
  };
  const updateStaff = (id: string, patch: Partial<StaffItem>) => {
    const month = selectedMonthKey;
    patchMonth(month, m => ({
      ...m,
      staffList: m.staffList.map(s => (s.id === id ? { ...s, ...patch } : s)),
    }));

    // Persist the amount (debounced — the screen edits it on every keystroke).
    if (patch.amount === undefined) return;
    const existing = (monthsDataRef.current[month]?.staffList || []).find(s => s.id === id);
    const name = patch.name ?? existing?.name ?? '';
    const fixAmount = patch.fixAmount ?? existing?.fixAmount ?? 0;
    const amount = patch.amount;

    if (staffTimers.current[id]) clearTimeout(staffTimers.current[id]);
    staffTimers.current[id] = setTimeout(() => {
      api
        .setStaffAmount({ month, staffId: id, amount, name, fixAmount })
        .then(() => syncBus?.postMessage({ type: 'MUTATION', monthKey: month }))
        .catch(err => console.error('Failed to save staff amount', err));
    }, 500);
  };

  // ---- Categories ----
  const addCategory = (categoryData: Omit<ExpenseCategory, 'id' | 'isDefault' | 'order'>) => {
    api
      .addCategory({
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
      })
      .then(res => setCategories(prev => [...prev, res.category as ExpenseCategory]))
      .catch(err => console.error('Failed to add category', err));
  };

  const updateCategory = (id: string, updates: Partial<ExpenseCategory>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    api
      .updateCategory({
        id,
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        isEnabled: updates.isEnabled,
      })
      .catch(err => console.error('Failed to update category', err));
  };

  const toggleCategory = (id: string) => {
    let nextEnabled = true;
    setCategories(prev =>
      prev.map(c => {
        if (c.id === id) {
          nextEnabled = !c.isEnabled;
          return { ...c, isEnabled: nextEnabled };
        }
        return c;
      })
    );
    api.updateCategory({ id, isEnabled: nextEnabled }).catch(err => console.error('Failed to toggle category', err));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    if (currentTab === id) setCurrentTab('dashboard');
    api.deleteCategory(id).catch(err => console.error('Failed to delete category', err));
  };

  return (
    <AppContext.Provider
      value={{
        authStatus,
        user,
        login,
        register,
        logout,
        currentTab,
        setCurrentTab,
        selectedMonthKey,
        selectedMonthData,
        availableMonthKeys,
        summary,
        monthLoading,
        staffError,
        settings,
        updateSettings,
        setMonth,
        nextMonth,
        prevMonth,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleCategory,
        addStaff,
        updateStaff,
        deleteStaff,
        addEMI,
        updateEMI,
        deleteEMI,
        addShopExpense,
        updateShopExpense,
        deleteShopExpense,
        addOtherExpense,
        updateOtherExpense,
        deleteOtherExpense,
        addCustomExpense,
        updateCustomExpense,
        deleteCustomExpense,
        updateBudget,
        resetToDefaults,
        quickActionType,
        setQuickActionType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
