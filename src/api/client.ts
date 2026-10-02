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
    const message = (data && (data.message || data.error)) || `Request failed (${res.status})`;
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
    // 1. If a specific month is requested (e.g. "2026-10" or "2026-09"), query it directly
    if (month && month !== 'ALL') {
      return await request<PartnerIncomeResponse>('partner_income.php', { query: { month, group } });
    }

    // 2. If 'ALL' is requested, attempt native 'ALL' query first
    try {
      const res = await request<PartnerIncomeResponse>('partner_income.php', { query: { month: 'ALL', group } });
      if (res && res.ok && res.month === 'ALL' && Array.isArray(res.items)) {
        return res;
      }
    } catch {
      // Backend returned 422 or doesn't support 'ALL' yet -> query months in parallel
    }

    // Fallback: Query all relevant months across the current & previous years
    const currentYear = new Date().getFullYear();
    const candidateMonths: string[] = [];
    for (let y = currentYear - 1; y <= currentYear + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        candidateMonths.push(`${y}-${String(m).padStart(2, '0')}`);
      }
    }

    const settled = await Promise.allSettled(
      candidateMonths.map(m =>
        request<PartnerIncomeResponse>('partner_income.php', { query: { month: m, group } })
      )
    );

    const mergedItems: PartnerIncomeItem[] = [];
    for (const item of settled) {
      if (item.status === 'fulfilled' && item.value && Array.isArray(item.value.items)) {
        mergedItems.push(...item.value.items);
      }
    }

    // Sort descending by date and ID
    mergedItems.sort((a, b) => b.incomeDate.localeCompare(a.incomeDate) || Number(b.id) - Number(a.id));

    // Deduplicate by ID
    const seen = new Set<string>();
    const uniqueItems = mergedItems.filter(it => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });

    // Compute complete summary for all months
    const summary: PartnerIncomeSummary = {
      daal_roti: { total: 0, partners: { 'Vijender Prajapati': 0, 'Chay Chaupal': 0 } },
      chay_chaupal: { total: 0, partners: { 'Sandeep': 0, 'Narender': 0 } },
    };
    for (const it of uniqueItems) {
      const g = it.partnerGroup;
      if (summary[g]) {
        summary[g].total += it.totalAmount;
        const p1 = it.partner1Name;
        const p2 = it.partner2Name;
        summary[g].partners[p1] = (summary[g].partners[p1] || 0) + it.partner1Amount;
        summary[g].partners[p2] = (summary[g].partners[p2] || 0) + it.partner2Amount;
      }
    }

    return {
      ok: true,
      month: 'ALL',
      items: uniqueItems,
      summary,
    };
  },

  addPartnerIncome: (payload: {
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
  }) => {
    const validMonth =
      payload.month && payload.month !== 'ALL'
        ? payload.month
        : (payload.incomeDate ? payload.incomeDate.substring(0, 7) : new Date().toISOString().substring(0, 7));

    return request<{ ok: true; item: PartnerIncomeItem }>('partner_income.php', {
      method: 'POST',
      body: {
        ...payload,
        month: validMonth,
      },
    });
  },

  updatePartnerIncome: (payload: {
    id: string;
    month?: string;
    partnerGroup?: PartnerGroup;
    totalAmount?: number;
    incomeDate?: string;
    paymentMode?: string;
    remarks?: string | null;
    partner1Name?: string;
    partner1Amount?: number;
    partner2Name?: string;
    partner2Amount?: number;
  }) => {
    const validMonth =
      payload.month && payload.month !== 'ALL'
        ? payload.month
        : (payload.incomeDate ? payload.incomeDate.substring(0, 7) : undefined);

    return request<{ ok: true; item: PartnerIncomeItem }>('partner_income.php', {
      method: 'PUT',
      body: {
        ...payload,
        ...(validMonth ? { month: validMonth } : {}),
      },
    });
  },

  deletePartnerIncome: (id: string) =>
    request<{ ok: true }>('partner_income.php', {
      method: 'DELETE',
      body: { id },
    }),
};

/** Clear any legacy/stale partner income mock data from browser localStorage */
export function clearStalePartnerLocalData(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fix_partner_income_')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}

