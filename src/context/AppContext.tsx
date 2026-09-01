import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { initialMonthsData, initialCafeSettings, initialExpenseCategories } from '../data/mockData';
import { calculateMonthSummary, MonthSummary } from '../utils/calculations';

interface AppContextType {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  selectedMonthKey: string;
  selectedMonthData: MonthData;
  availableMonthKeys: string[];
  summary: MonthSummary;
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
  // Staff CRUD
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
  // Reset
  resetToDefaults: () => void;
  // Global quick action modal trigger
  quickActionType: string | null;
  setQuickActionType: (type: string | null) => void;
}

const STORAGE_KEY_DATA = 'fix_spend_months_data_v1';
const STORAGE_KEY_SETTINGS = 'fix_spend_settings_v1';
const STORAGE_KEY_MONTH = 'fix_spend_active_month_v1';
const STORAGE_KEY_CATEGORIES = 'fix_spend_categories_v1';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [quickActionType, setQuickActionType] = useState<string | null>(null);

  // Categories list
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load categories from localStorage', e);
    }
    return initialExpenseCategories;
  });

  // Load months data from localStorage or fallback to mockData
  const [monthsData, setMonthsData] = useState<Record<string, MonthData>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load months data from localStorage', e);
    }
    return initialMonthsData;
  });

  // Settings
  const [settings, setSettings] = useState<CafeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
    return initialCafeSettings;
  });

  // Selected Month Key
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MONTH);
      if (saved && initialMonthsData[saved]) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load active month from localStorage', e);
    }
    return '2026-09';
  });

  // Persist categories
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories]);

  // Persist data
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(monthsData));
    } catch (e) {
      console.error('Failed to save months data to localStorage', e);
    }
  }, [monthsData]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Persist active month
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MONTH, selectedMonthKey);
    } catch (e) {
      console.error('Failed to save active month to localStorage', e);
    }
  }, [selectedMonthKey]);

  // Available month keys
  const availableMonthKeys = Object.keys(monthsData).sort();

  // Active month data
  const selectedMonthData: MonthData = monthsData[selectedMonthKey] || {
    monthKey: selectedMonthKey,
    monthName: 'Unknown Month',
    budget: settings.defaultMonthlyBudget,
    staffList: [],
    emiList: [],
    shopExpenses: [],
    otherExpenses: [],
    customExpenses: {},
  };

  // Summary calculation
  const summary = calculateMonthSummary(selectedMonthData, categories);

  // Month navigation
  const setMonth = (monthKey: string) => {
    if (monthsData[monthKey]) {
      setSelectedMonthKey(monthKey);
    }
  };

  const nextMonth = () => {
    const currentIndex = availableMonthKeys.indexOf(selectedMonthKey);
    if (currentIndex < availableMonthKeys.length - 1) {
      setSelectedMonthKey(availableMonthKeys[currentIndex + 1]);
    }
  };

  const prevMonth = () => {
    const currentIndex = availableMonthKeys.indexOf(selectedMonthKey);
    if (currentIndex > 0) {
      setSelectedMonthKey(availableMonthKeys[currentIndex - 1]);
    }
  };

  const updateSettings = (newSettings: Partial<CafeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateBudget = (budget: number) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        budget,
      },
    }));
  };

  // Categories CRUD
  const addCategory = (categoryData: Omit<ExpenseCategory, 'id' | 'isDefault' | 'order'>) => {
    const id = `cat_${Date.now()}`;
    const newCategory: ExpenseCategory = {
      ...categoryData,
      id,
      isDefault: false,
      isEnabled: true,
      order: categories.length + 1,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<ExpenseCategory>) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const toggleCategory = (id: string) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    if (currentTab === id) {
      setCurrentTab('dashboard');
    }
  };

  // Staff CRUD
  const addStaff = (item: Omit<StaffItem, 'id'>) => {
    const id = `st-${Date.now()}`;
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        staffList: [...(prev[selectedMonthKey]?.staffList || []), { ...item, id }],
      },
    }));
  };

  const updateStaff = (id: string, item: Partial<StaffItem>) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        staffList: (prev[selectedMonthKey]?.staffList || []).map(s =>
          s.id === id ? { ...s, ...item } : s
        ),
      },
    }));
  };

  const deleteStaff = (id: string) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        staffList: (prev[selectedMonthKey]?.staffList || []).filter(s => s.id !== id),
      },
    }));
  };

  // EMI CRUD
  const addEMI = (item: Omit<EMIItem, 'id'>) => {
    const id = `emi-${Date.now()}`;
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        emiList: [...(prev[selectedMonthKey]?.emiList || []), { ...item, id }],
      },
    }));
  };

  const updateEMI = (id: string, item: Partial<EMIItem>) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        emiList: (prev[selectedMonthKey]?.emiList || []).map(e =>
          e.id === id ? { ...e, ...item } : e
        ),
      },
    }));
  };

  const deleteEMI = (id: string) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        emiList: (prev[selectedMonthKey]?.emiList || []).filter(e => e.id !== id),
      },
    }));
  };

  // Shop Expenses CRUD
  const addShopExpense = (item: Omit<ShopExpenseItem, 'id'>) => {
    const id = `sh-${Date.now()}`;
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        shopExpenses: [...(prev[selectedMonthKey]?.shopExpenses || []), { ...item, id }],
      },
    }));
  };

  const updateShopExpense = (id: string, item: Partial<ShopExpenseItem>) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        shopExpenses: (prev[selectedMonthKey]?.shopExpenses || []).map(s =>
          s.id === id ? { ...s, ...item } : s
        ),
      },
    }));
  };

  const deleteShopExpense = (id: string) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        shopExpenses: (prev[selectedMonthKey]?.shopExpenses || []).filter(s => s.id !== id),
      },
    }));
  };

  // Other Expenses CRUD
  const addOtherExpense = (item: Omit<OtherExpenseItem, 'id'>) => {
    const id = `ot-${Date.now()}`;
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        otherExpenses: [...(prev[selectedMonthKey]?.otherExpenses || []), { ...item, id }],
      },
    }));
  };

  const updateOtherExpense = (id: string, item: Partial<OtherExpenseItem>) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        otherExpenses: (prev[selectedMonthKey]?.otherExpenses || []).map(o =>
          o.id === id ? { ...o, ...item } : o
        ),
      },
    }));
  };

  const deleteOtherExpense = (id: string) => {
    setMonthsData(prev => ({
      ...prev,
      [selectedMonthKey]: {
        ...prev[selectedMonthKey],
        otherExpenses: (prev[selectedMonthKey]?.otherExpenses || []).filter(o => o.id !== id),
      },
    }));
  };

  // Custom Expenses CRUD
  const addCustomExpense = (categoryId: string, item: Omit<GenericExpenseItem, 'id'>) => {
    const id = `cx-${Date.now()}`;
    setMonthsData(prev => {
      const currentMonth = prev[selectedMonthKey];
      const customExpenses = currentMonth.customExpenses || {};
      const catList = customExpenses[categoryId] || [];
      return {
        ...prev,
        [selectedMonthKey]: {
          ...currentMonth,
          customExpenses: {
            ...customExpenses,
            [categoryId]: [...catList, { ...item, id }],
          },
        },
      };
    });
  };

  const updateCustomExpense = (categoryId: string, itemId: string, item: Partial<GenericExpenseItem>) => {
    setMonthsData(prev => {
      const currentMonth = prev[selectedMonthKey];
      const customExpenses = currentMonth.customExpenses || {};
      const catList = customExpenses[categoryId] || [];
      return {
        ...prev,
        [selectedMonthKey]: {
          ...currentMonth,
          customExpenses: {
            ...customExpenses,
            [categoryId]: catList.map(i => (i.id === itemId ? { ...i, ...item } : i)),
          },
        },
      };
    });
  };

  const deleteCustomExpense = (categoryId: string, itemId: string) => {
    setMonthsData(prev => {
      const currentMonth = prev[selectedMonthKey];
      const customExpenses = currentMonth.customExpenses || {};
      const catList = customExpenses[categoryId] || [];
      return {
        ...prev,
        [selectedMonthKey]: {
          ...currentMonth,
          customExpenses: {
            ...customExpenses,
            [categoryId]: catList.filter(i => i.id !== itemId),
          },
        },
      };
    });
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    setMonthsData(initialMonthsData);
    setSettings(initialCafeSettings);
    setCategories(initialExpenseCategories);
    setSelectedMonthKey('2026-09');
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        selectedMonthKey,
        selectedMonthData,
        availableMonthKeys,
        summary,
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
