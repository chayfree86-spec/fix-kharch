import React, { useState } from 'react';
import { Coffee, LogIn, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../ui/Logo';

// Remember the last successful login so the form prefills next time.
const SAVED_ID_KEY = 'fix_spend_login_id';
const SAVED_SECRET_KEY = 'fix_spend_login_sec';

const encode = (v: string) => {
  try {
    return btoa(unescape(encodeURIComponent(v)));
  } catch {
    return '';
  }
};
const decode = (v: string | null) => {
  if (!v) return '';
  try {
    return decodeURIComponent(escape(atob(v)));
  } catch {
    return '';
  }
};

export const AuthScreen: React.FC = () => {
  const { login } = useApp();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState(() => localStorage.getItem(SAVED_ID_KEY) || '');
  const [password, setPassword] = useState(() => decode(localStorage.getItem(SAVED_SECRET_KEY)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      // Remember for next time (prefilled login).
      localStorage.setItem(SAVED_ID_KEY, identifier.trim());
      localStorage.setItem(SAVED_SECRET_KEY, encode(password));
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-warm-beige">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold text-coffee mt-3">Fix Spend</h1>
          <p className="text-sm text-caramel">Manage Fixed Expenses. Grow Your Café.</p>
        </div>

        <div className="bg-cream rounded-card border border-border-warm shadow-warm-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-btn bg-coffee text-cream flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-coffee">Sign in</h2>
              <p className="text-[11px] text-caramel">Enter your login details to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
                Mobile or Email <span className="text-expense-red">*</span>
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="9628717175"
                className={inputClass}
                autoComplete="username"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
                Password <span className="text-expense-red">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-expense-red bg-expense-red/10 p-2.5 rounded-btn animate-fade-in">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-btn bg-expense-red hover:bg-expense-red-dark text-cream font-semibold text-sm shadow-warm-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Please wait…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Login
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-caramel mt-4 flex items-center justify-center gap-1">
          <Coffee className="w-3 h-3" /> A polished fixed-expense manager for café owners.
        </p>
      </div>
    </div>
  );
};
