import { MonthData, CafeSettings, ExpenseCategory } from '../types';

export const initialCafeSettings: CafeSettings = {
  cafeName: 'Fix Spend Café',
  tagline: 'Manage Fixed Expenses. Grow Your Café.',
  defaultMonthlyBudget: 0,
  currencySymbol: '₹',
};

export const initialExpenseCategories: ExpenseCategory[] = [
  {
    id: 'staff',
    name: 'Staff Kharch',
    description: 'Salaries & Allowances',
    icon: 'users',
    isDefault: true,
    isEnabled: true,
    order: 1,
  },
  {
    id: 'emi',
    name: 'Bank EMI',
    description: 'Loans & Credit Repayments',
    icon: 'landmark',
    isDefault: true,
    isEnabled: true,
    order: 2,
  },
  {
    id: 'shop',
    name: 'Shop Expenses',
    description: 'Rent, Light Bill, GST & Operations',
    icon: 'store',
    isDefault: true,
    isEnabled: true,
    order: 3,
  },
  {
    id: 'other',
    name: 'Other Expenses',
    description: 'Supplies, Packaging & Maintenance',
    icon: 'receipt',
    isDefault: true,
    isEnabled: true,
    order: 4,
  },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Build a "YYYY-MM" key from a Date. */
export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Human-readable label, e.g. "September 2026", for a "YYYY-MM" key. */
export function getMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Shift a "YYYY-MM" key by a number of months (delta may be negative). */
export function addMonthsToKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  return getMonthKey(new Date(year, month - 1 + delta, 1));
}

/** The current calendar month as a "YYYY-MM" key. */
export function getCurrentMonthKey(): string {
  return getMonthKey(new Date());
}

/** Create an empty month record ready for the user to fill in. */
export function createEmptyMonth(monthKey: string, budget: number): MonthData {
  return {
    monthKey,
    monthName: getMonthName(monthKey),
    budget,
    staffList: [],
    emiList: [],
    shopExpenses: [],
    otherExpenses: [],
    customExpenses: {},
  };
}

// The app starts with a single empty month (the current calendar month).
// Additional months are created on demand as the user navigates.
export const initialMonthsData: Record<string, MonthData> = {
  [getCurrentMonthKey()]: createEmptyMonth(
    getCurrentMonthKey(),
    initialCafeSettings.defaultMonthlyBudget
  ),
};
