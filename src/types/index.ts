export interface StaffItem {
  id: string;
  name: string;
  amount: number;      // Actual amount counted towards Total Expense
  fixAmount: number;   // Reference Fixed Salary amount (not counted in Total Expense)
}

export interface EMIItem {
  id: string;
  name: string;
  amount: number;
}

export interface ShopExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface OtherExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface GenericExpenseItem {
  id: string;
  name: string;
  amount: number;
  notes?: string;
}

export interface ExpenseCategory {
  id: string; // e.g. "staff", "emi", "shop", "other", or "cat_1725..."
  name: string; // e.g. "Staff Kharch", "Bank EMI", "Vendor Payment"
  description?: string;
  icon: string; // icon name: "users", "landmark", "store", "receipt", "truck", "utensils", "tag", "wrench", "shopping-bag", "wallet", "shield", "layers", "coffee", "box"
  isDefault?: boolean;
  isEnabled: boolean;
  order: number;
}

export interface MonthData {
  monthKey: string; // e.g. "2026-09"
  monthName: string; // e.g. "September 2026"
  budget: number;
  staffList: StaffItem[];
  emiList: EMIItem[];
  shopExpenses: ShopExpenseItem[];
  otherExpenses: OtherExpenseItem[];
  customExpenses?: Record<string, GenericExpenseItem[]>; // categoryId -> items
}

export interface CafeSettings {
  cafeName: string;
  tagline: string;
  defaultMonthlyBudget: number;
  currencySymbol: string;
  staffBusinessId?: number | null; // Linked Staff-app business (source of staff)
}

export type TabType = string; // Supports 'dashboard' | 'reports' | 'settings' and any category.id
