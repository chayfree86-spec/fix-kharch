import React from 'react';
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../ui/Logo';
import { formatINR } from '../../utils/currency';
import { getCategoryIconComponent } from '../../utils/categoryIcons';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, summary, categories, selectedMonthData } = useApp();

  // Active enabled categories
  const enabledCategories = categories.filter(c => c.isEnabled);

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-cream border-r border-border-warm h-screen sticky top-0 p-4 lg:p-4.5 flex-shrink-0 justify-between">
      {/* Top section: Logo & Dynamic Nav */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-1 flex-shrink-0 pb-1.5">
          <Logo size="full" showTagline={false} className="w-full" />
        </div>

        {/* Navigation links - Scrollable if many categories */}
        <nav className="space-y-1 overflow-y-auto flex-1 pr-1 pt-1">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-btn text-sm font-semibold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-coffee text-cream shadow-warm-sm'
                : 'text-coffee/80 hover:bg-warm-beige/60 hover:text-coffee'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard
                className={`w-5 h-5 ${currentTab === 'dashboard' ? 'text-cream' : 'text-caramel'}`}
              />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Dynamic Categories */}
          {enabledCategories.map(cat => {
            const Icon = getCategoryIconComponent(cat.icon);
            const isActive = currentTab === cat.id;
            const count =
              cat.id === 'staff'
                ? summary.staffCount
                : cat.id === 'emi'
                ? summary.emiCount
                : cat.id === 'shop'
                ? summary.shopCount
                : cat.id === 'other'
                ? summary.otherCount
                : (selectedMonthData.customExpenses?.[cat.id] || []).length;

            return (
              <button
                key={cat.id}
                onClick={() => setCurrentTab(cat.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-btn text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-coffee text-cream shadow-warm-sm'
                    : 'text-coffee/80 hover:bg-warm-beige/60 hover:text-coffee'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cream' : 'text-caramel'}`} />
                  <span className="truncate">{cat.name}</span>
                </div>
                {count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-cream/20 text-cream' : 'bg-warm-beige text-caramel font-bold'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Reports & Analytics */}
          <button
            onClick={() => setCurrentTab('reports')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-btn text-sm font-semibold transition-all ${
              currentTab === 'reports'
                ? 'bg-coffee text-cream shadow-warm-sm'
                : 'text-coffee/80 hover:bg-warm-beige/60 hover:text-coffee'
            }`}
          >
            <div className="flex items-center gap-3">
              <ChartNoAxesCombined
                className={`w-5 h-5 ${currentTab === 'reports' ? 'text-cream' : 'text-caramel'}`}
              />
              <span>Reports & Analytics</span>
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-btn text-sm font-semibold transition-all ${
              currentTab === 'settings'
                ? 'bg-coffee text-cream shadow-warm-sm'
                : 'text-coffee/80 hover:bg-warm-beige/60 hover:text-coffee'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings
                className={`w-5 h-5 ${currentTab === 'settings' ? 'text-cream' : 'text-caramel'}`}
              />
              <span>Settings</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Bottom section: Quick financial widget */}
      <div className="pt-3 border-t border-border-warm/70 flex-shrink-0">
        <div className="bg-warm-beige/60 p-3 rounded-card border border-border-warm/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-caramel font-semibold">Total Expense</span>
            <span className="text-expense-red font-bold">{formatINR(summary.totalExpense)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-caramel font-semibold">Balance</span>
            <span className={`font-bold ${summary.isDeficit ? 'text-expense-red' : 'text-coffee'}`}>
              {formatINR(summary.balance)}
            </span>
          </div>
          <div className="w-full bg-cream rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-expense-red h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.round((summary.totalExpense / (summary.budget || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
