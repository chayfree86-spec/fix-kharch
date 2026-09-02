import { StaffItem, EMIItem, ShopExpenseItem, OtherExpenseItem, MonthData, ExpenseCategory } from '../types';

export function calculateStaffTotal(staffList: StaffItem[]): number {
  // Actual paid/counted amount towards Total Expense
  return (staffList || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function calculateStaffFixTotal(staffList: StaffItem[]): number {
  // Fixed planned salary amount towards Total Budget
  return (staffList || []).reduce((sum, item) => sum + (Number(item.fixAmount) || 0), 0);
}

export function calculateEMITotal(emiList: EMIItem[]): number {
  return (emiList || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function calculateShopTotal(shopExpenses: ShopExpenseItem[]): number {
  return (shopExpenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function calculateOtherTotal(otherExpenses: OtherExpenseItem[]): number {
  return (otherExpenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export interface CategorySummaryInfo {
  total: number;
  count: number;
}

export interface MonthSummary {
  budget: number;
  staffFixTotal: number;
  staffTotal: number;
  staffCount: number;
  emiTotal: number;
  emiCount: number;
  shopTotal: number;
  shopCount: number;
  otherTotal: number;
  otherCount: number;
  categoryBreakdown: Record<string, CategorySummaryInfo>;
  totalExpense: number;
  balance: number;
  isDeficit: boolean;
  isSurplus: boolean;
}

export function calculateMonthSummary(data: MonthData, categories?: ExpenseCategory[]): MonthSummary {
  const staffFixTotal = calculateStaffFixTotal(data.staffList);
  const staffTotal = calculateStaffTotal(data.staffList);
  const emiTotal = calculateEMITotal(data.emiList);
  const shopTotal = calculateShopTotal(data.shopExpenses);
  const otherTotal = calculateOtherTotal(data.otherExpenses);

  const breakdown: Record<string, CategorySummaryInfo> = {
    staff: { total: staffTotal, count: data.staffList?.length || 0 },
    emi: { total: emiTotal, count: data.emiList?.length || 0 },
    shop: { total: shopTotal, count: data.shopExpenses?.length || 0 },
    other: { total: otherTotal, count: data.otherExpenses?.length || 0 },
  };

  let totalBudget = 0;
  let totalExpense = 0;

  // If categories are provided, filter by enabled status
  if (categories && categories.length > 0) {
    categories.forEach(cat => {
      if (cat.isEnabled) {
        if (cat.id === 'staff') {
          totalBudget += staffFixTotal;
          totalExpense += staffTotal;
        } else if (cat.id === 'emi') {
          totalBudget += emiTotal;
          totalExpense += emiTotal;
        } else if (cat.id === 'shop') {
          totalBudget += shopTotal;
          totalExpense += shopTotal;
        } else if (cat.id === 'other') {
          totalBudget += otherTotal;
          totalExpense += otherTotal;
        } else {
          // Custom category
          const items = data.customExpenses?.[cat.id] || [];
          const catSum = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
          breakdown[cat.id] = { total: catSum, count: items.length };
          totalBudget += catSum;
          totalExpense += catSum;
        }
      }
    });
  } else {
    // Default sum: Budget includes staff fixed salary; Total Expense includes staff counted actual salary
    totalBudget = staffFixTotal + emiTotal + shopTotal + otherTotal;
    totalExpense = staffTotal + emiTotal + shopTotal + otherTotal;
    if (data.customExpenses) {
      Object.entries(data.customExpenses).forEach(([catId, items]) => {
        const catSum = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        breakdown[catId] = { total: catSum, count: items.length };
        totalBudget += catSum;
        totalExpense += catSum;
      });
    }
  }

  const balance = totalBudget - totalExpense;

  return {
    budget: totalBudget,
    staffFixTotal,
    staffTotal,
    staffCount: data.staffList?.length || 0,
    emiTotal,
    emiCount: data.emiList?.length || 0,
    shopTotal,
    shopCount: data.shopExpenses?.length || 0,
    otherTotal,
    otherCount: data.otherExpenses?.length || 0,
    categoryBreakdown: breakdown,
    totalExpense,
    balance,
    isDeficit: balance < 0,
    isSurplus: balance > 0,
  };
}
