export interface StaffItem {
  id: string;
  name: string;
  amount: number;       // Actual amount counted towards Total Expense
  fixAmount: number;    // Reference Fixed Salary amount (for Total Budget)
  mobile?: string | null;
  perDaySalary?: number;
  presentDays?: number; // Attendance present/credited days this month
  absentDays?: number;
  advance?: number;     // Advance taken this month from Staff-app
  deduction?: number;   // Deductions / penalties this month from Staff-app
  earnedSalary?: number;
  netPayable?: number;
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

export type TabType = string; // Supports 'dashboard' | 'reports' | 'settings' | 'partner_income' and any category.id

export type PartnerGroup = 'daal_roti' | 'chay_chaupal';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface PartnerIncomeItem {
  id: string;
  monthKey: string;
  partnerGroup: PartnerGroup;
  totalAmount: number;
  incomeDate: string; // YYYY-MM-DD
  paymentMode: PaymentMode | string;
  remarks?: string | null;
  partner1Name: string;
  partner1Amount: number;
  partner2Name: string;
  partner2Amount: number;
  createdAt?: string;
}

export interface PartnerGroupSummary {
  total: number;
  partners: Record<string, number>;
}

export interface PartnerIncomeSummary {
  daal_roti: PartnerGroupSummary;
  chay_chaupal: PartnerGroupSummary;
}

export interface PartnerIncomeResponse {
  ok: boolean;
  month: string;
  items: PartnerIncomeItem[];
  summary: PartnerIncomeSummary;
}

