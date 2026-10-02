import { PartnerIncomeItem, PartnerGroup, PartnerIncomeResponse, PartnerIncomeSummary } from '../types';

// Thin fetch wrapper around the fix-kharch PHP API.
// All requests send the session cookie (credentials: 'include').

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  let url = `${BASE}/${path}`;
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== '') params.append(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method || 'GET',
      credentials: 'include',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (e) {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

// ---- Shapes returned by the API (subset we consume) ----

export interface ApiUser {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
}

export interface ApiSettings {
  cafeName: string;
  tagline: string;
  currencySymbol: string;
  defaultMonthlyBudget: number;
  staffBusinessId: number | null;
}

export interface ApiCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  isDefault?: boolean;
  isEnabled: boolean;
  order: number;
}

export interface BootstrapData {
  settings: ApiSettings;
  categories: ApiCategory[];
}

export interface AuthResponse {
  ok: true;
  user: ApiUser;
  data: BootstrapData;
}

export interface ApiExpenseItem {
  id: string;
  category: string;
  name: string;
  amount: number;
  notes: string | null;
}

export interface ApiStaffItem {
  id: string;
  name: string;
  fixAmount: number;
  amount: number;
  mobile?: string | null;
  perDaySalary?: number;
  presentDays?: number;
  absentDays?: number;
  advance?: number;
  deduction?: number;
  earnedSalary?: number;
  netPayable?: number;
}

export const api = {
  // --- Auth ---
  me: () => request<AuthResponse>('me.php'),
  login: (identifier: string, password: string) =>
    request<AuthResponse>('login.php', { method: 'POST', body: { identifier, password } }),
  register: (payload: {
    name: string;
    email?: string;
    mobile?: string;
    password: string;
    cafeName?: string;
    businessId?: number | string;
  }) => request<AuthResponse>('register.php', { method: 'POST', body: payload }),
  logout: () => request('logout.php', { method: 'POST' }),

  // --- Settings ---
  updateSettings: (patch: Partial<ApiSettings>) =>
    request<{ data: BootstrapData }>('settings.php', { method: 'PUT', body: patch }),

  // --- Categories ---
  addCategory: (payload: { name: string; description?: string; icon?: string }) =>
    request<{ category: ApiCategory }>('categories.php', { method: 'POST', body: payload }),
  updateCategory: (payload: { id: string; name?: string; description?: string; icon?: string; isEnabled?: boolean }) =>
    request<{ category: ApiCategory }>('categories.php', { method: 'PUT', body: payload }),
  deleteCategory: (id: string) =>
    request('categories.php', { method: 'DELETE', body: { id } }),

  // --- Budget ---
  getBudget: (month: string) =>
    request<{ month: string; budget: number }>('budget.php', { query: { month } }),
  setBudget: (month: string, budget: number) =>
    request<{ month: string; budget: number }>('budget.php', { method: 'PUT', body: { month, budget } }),

  // --- Expenses (emi / shop / other / custom) ---
  listExpenses: (month: string) =>
    request<{ month: string; items: ApiExpenseItem[] }>('expenses.php', { query: { month } }),
  addExpense: (payload: { month: string; category: string; name: string; amount: number; notes?: string | null }) =>
    request<{ item: ApiExpenseItem }>('expenses.php', { method: 'POST', body: payload }),
  updateExpense: (payload: { id: string; name?: string; amount?: number; notes?: string | null }) =>
    request<{ item: ApiExpenseItem }>('expenses.php', { method: 'PUT', body: payload }),
  deleteExpense: (id: string) =>
    request('expenses.php', { method: 'DELETE', body: { id } }),

  // --- Staff (roster from Staff-app, manual monthly amount) ---
  listStaff: (month: string) =>
    request<{ month: string; staff: ApiStaffItem[]; message?: string }>('staff.php', { query: { month } }),
  setStaffAmount: (payload: { month: string; staffId: string; amount: number; name: string; fixAmount: number }) =>
    request<{ staff: ApiStaffItem }>('staff.php', { method: 'PUT', body: payload }),

  // --- Partner Income ---
  listPartnerIncome: async (month: string, group?: string): Promise<PartnerIncomeResponse> => {
    try {
      const res = await request<PartnerIncomeResponse>('partner_income.php', { query: { month, group } });
      if (res && res.ok) {
        saveLocalPartnerData(month, res);
        return res;
      }
    } catch {
      // Endpoint not deployed to live server yet -> fallback to local storage
    }
    const local = getLocalPartnerData(month);
    if (group) {
      return {
        ...local,
        items: local.items.filter(i => i.partnerGroup === group),
      };
    }
    return local;
  },

  addPartnerIncome: async (payload: {
    month: string;
    partnerGroup: PartnerGroup;
    totalAmount: number;
    incomeDate: string;
    paymentMode: string;
    remarks?: string | null;
    partner1Name: string;
    partner1Amount: number;
    partner2Name: string;
    partner2Amount: number;
  }): Promise<{ ok: true; item: PartnerIncomeItem }> => {
    try {
      const res = await request<{ ok: true; item: PartnerIncomeItem }>('partner_income.php', {
        method: 'POST',
        body: payload,
      });
      if (res && res.ok) {
        return res;
      }
    } catch {
      // Fallback
    }
    const local = getLocalPartnerData(payload.month);
    const newItem: PartnerIncomeItem = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthKey: payload.month,
      partnerGroup: payload.partnerGroup,
      totalAmount: payload.totalAmount,
      incomeDate: payload.incomeDate,
      paymentMode: payload.paymentMode,
      remarks: payload.remarks || null,
      partner1Name: payload.partner1Name,
      partner1Amount: payload.partner1Amount,
      partner2Name: payload.partner2Name,
      partner2Amount: payload.partner2Amount,
      createdAt: new Date().toISOString(),
    };
    local.items.unshift(newItem);
    local.summary = recalculateSummary(local.items);
    saveLocalPartnerData(payload.month, local);
    return { ok: true, item: newItem };
  },

  updatePartnerIncome: async (payload: {
    id: string;
    month: string;
    partnerGroup?: PartnerGroup;
    totalAmount?: number;
    incomeDate?: string;
    paymentMode?: string;
    remarks?: string | null;
    partner1Name?: string;
    partner1Amount?: number;
    partner2Name?: string;
    partner2Amount?: number;
  }): Promise<{ ok: true; item: PartnerIncomeItem }> => {
    try {
      const res = await request<{ ok: true; item: PartnerIncomeItem }>('partner_income.php', {
        method: 'PUT',
        body: payload,
      });
      if (res && res.ok) {
        return res;
      }
    } catch {
      // Fallback
    }
    const local = getLocalPartnerData(payload.month);
    const idx = local.items.findIndex(i => i.id === payload.id);
    if (idx !== -1) {
      local.items[idx] = {
        ...local.items[idx],
        ...(payload.partnerGroup ? { partnerGroup: payload.partnerGroup } : {}),
        ...(payload.totalAmount !== undefined ? { totalAmount: payload.totalAmount } : {}),
        ...(payload.incomeDate ? { incomeDate: payload.incomeDate } : {}),
        ...(payload.paymentMode ? { paymentMode: payload.paymentMode } : {}),
        ...(payload.remarks !== undefined ? { remarks: payload.remarks } : {}),
        ...(payload.partner1Name ? { partner1Name: payload.partner1Name } : {}),
        ...(payload.partner1Amount !== undefined ? { partner1Amount: payload.partner1Amount } : {}),
        ...(payload.partner2Name ? { partner2Name: payload.partner2Name } : {}),
        ...(payload.partner2Amount !== undefined ? { partner2Amount: payload.partner2Amount } : {}),
      };
      local.summary = recalculateSummary(local.items);
      saveLocalPartnerData(payload.month, local);
      return { ok: true, item: local.items[idx] };
    }
    throw new ApiError('Item not found', 404);
  },

  deletePartnerIncome: async (id: string, month: string): Promise<{ ok: true }> => {
    try {
      const res = await request<{ ok: true }>('partner_income.php', {
        method: 'DELETE',
        body: { id },
      });
      if (res && res.ok) {
        return res;
      }
    } catch {
      // Fallback
    }
    const local = getLocalPartnerData(month);
    local.items = local.items.filter(i => i.id !== id);
    local.summary = recalculateSummary(local.items);
    saveLocalPartnerData(month, local);
    return { ok: true };
  },
};

// Local storage fallback helpers for partner income
function getLocalPartnerData(month: string): PartnerIncomeResponse {
  try {
    const raw = localStorage.getItem(`fix_partner_income_${month}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    ok: true,
    month,
    items: [],
    summary: {
      daal_roti: { total: 0, partners: { 'Vijender Prajapati': 0, 'Chay Chaupal': 0 } },
      chay_chaupal: { total: 0, partners: { 'Sandeep': 0, 'Narender': 0 } },
    },
  };
}

function saveLocalPartnerData(month: string, data: PartnerIncomeResponse) {
  try {
    localStorage.setItem(`fix_partner_income_${month}`, JSON.stringify(data));
  } catch {}
}

function recalculateSummary(items: PartnerIncomeItem[]): PartnerIncomeSummary {
  const summary: PartnerIncomeSummary = {
    daal_roti: { total: 0, partners: { 'Vijender Prajapati': 0, 'Chay Chaupal': 0 } },
    chay_chaupal: { total: 0, partners: { 'Sandeep': 0, 'Narender': 0 } },
  };
  for (const item of items) {
    const g = item.partnerGroup;
    if (summary[g]) {
      summary[g].total += item.totalAmount;
      const p1 = item.partner1Name;
      const p2 = item.partner2Name;
      summary[g].partners[p1] = (summary[g].partners[p1] || 0) + item.partner1Amount;
      summary[g].partners[p2] = (summary[g].partners[p2] || 0) + item.partner2Amount;
    }
  }
  return summary;
}

