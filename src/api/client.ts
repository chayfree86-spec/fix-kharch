// Thin fetch wrapper around the fix-kharch PHP API.
// All requests send the session cookie (credentials: 'include').

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost/fix-kharch/api').replace(/\/$/, '');

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
};
