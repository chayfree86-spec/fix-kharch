import React from 'react';
import {
  LayoutDashboard,
  UsersRound,
  Landmark,
  Store,
  ReceiptText,
  ChartNoAxesCombined,
  Settings,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { MonthSelector } from '../ui/MonthSelector';
import { useApp } from '../../context/AppContext';
import { getCategoryIconComponent } from '../../utils/categoryIcons';
import { useTheme } from '../../hooks/useTheme';

// Screens reachable directly from the mobile bottom nav — no back button needed.
const PRIMARY_MOBILE_TABS = new Set(['dashboard', 'shop', 'reports']);

export const AppHeader: React.FC = () => {
  const { currentTab, setCurrentTab, categories } = useApp();
  const { theme, toggleTheme } = useTheme();

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Overview & Summary', icon: LayoutDashboard };
      case 'staff':
        return { title: 'Staff Kharch', subtitle: 'Salaries & Allowances', icon: UsersRound };
      case 'emi':
        return { title: 'Bank EMI', subtitle: 'Loans & Installments', icon: Landmark };
      case 'shop':
        return { title: 'Shop Expenses', subtitle: 'Rent & Overheads', icon: Store };
      case 'other':
        return { title: 'Other Expenses', subtitle: 'Miscellaneous Costs', icon: ReceiptText };
      case 'reports':
        return { title: 'Reports & Analytics', subtitle: 'Expense Distribution', icon: ChartNoAxesCombined };
      case 'settings':
        return { title: 'Settings', subtitle: 'Café & Category Config', icon: Settings };
      default: {
        const foundCat = categories.find(c => c.id === currentTab);
        if (foundCat) {
          return {
            title: foundCat.name,
            subtitle: foundCat.description || 'Monthly Overheads',
            icon: getCategoryIconComponent(foundCat.icon),
          };
        }
        return { title: 'Dashboard', subtitle: 'Overview', icon: LayoutDashboard };
      }
    }
  };

  const { title, subtitle, icon: Icon } = getPageInfo();
  const showBack = !PRIMARY_MOBILE_TABS.has(currentTab);

  return (
    <header className="sticky top-0 z-30 bg-warm-beige/95 backdrop-blur-md border-b border-border-warm/70 safe-top">
      <div className="max-w-[1720px] w-full mx-auto flex items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 lg:px-8 xl:px-10 sm:py-3.5">
        {/* Page Title & Breadcrumb Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Mobile back button — only on screens not reachable from the bottom nav directly */}
          {showBack && (
            <button
              type="button"
              onClick={() => setCurrentTab('dashboard')}
              aria-label="Back"
              className="md:hidden w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-coffee active:bg-warm-beige-dark active:scale-95 transition-all flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-cream border border-border-warm text-coffee flex items-center justify-center shadow-sm flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-base sm:text-lg font-bold text-coffee leading-tight truncate">
              {title}
            </h1>
            <p className="text-[11px] text-caramel font-medium hidden sm:block truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Theme switcher + Month Selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            className="w-9 h-9 rounded-full bg-cream border border-border-warm text-coffee flex items-center justify-center shadow-sm active:scale-95 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <MonthSelector />
        </div>
      </div>
    </header>
  );
};
