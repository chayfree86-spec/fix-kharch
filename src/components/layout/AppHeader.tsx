import React from 'react';
import {
  LayoutDashboard,
  UsersRound,
  Landmark,
  Store,
  ReceiptText,
  ChartNoAxesCombined,
  Settings,
} from 'lucide-react';
import { MonthSelector } from '../ui/MonthSelector';
import { useApp } from '../../context/AppContext';
import { getCategoryIconComponent } from '../../utils/categoryIcons';

export const AppHeader: React.FC = () => {
  const { currentTab, categories } = useApp();

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

  return (
    <header className="sticky top-0 z-30 bg-warm-beige/95 backdrop-blur-md border-b border-border-warm/70 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Page Title & Breadcrumb Icon */}
        <div className="flex items-center gap-2.5 min-w-0">
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

        {/* Month Selector on right */}
        <div className="w-auto flex-shrink-0">
          <MonthSelector />
        </div>
      </div>
    </header>
  );
};
