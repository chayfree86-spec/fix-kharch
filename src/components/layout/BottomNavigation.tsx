import React from 'react';
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCategoryIconComponent } from '../../utils/categoryIcons';

export const BottomNavigation: React.FC = () => {
  const { currentTab, setCurrentTab, categories } = useApp();

  const enabledCategories = categories.filter(c => c.isEnabled);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-t border-border-warm md:hidden shadow-warm-lg safe-bottom"
    >
      <div className="flex items-center overflow-x-auto no-scrollbar px-1 py-1.5 justify-around">
        {/* Dashboard */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-btn min-h-[48px] min-w-[50px] transition-all relative flex-shrink-0 ${
            currentTab === 'dashboard' ? 'text-expense-red font-bold' : 'text-coffee/70 hover:text-coffee font-medium'
          }`}
        >
          {currentTab === 'dashboard' && (
            <span className="absolute top-0 w-8 h-1 bg-expense-red rounded-full animate-fade-in" />
          )}
          <LayoutDashboard
            className={`w-5 h-5 transition-transform ${
              currentTab === 'dashboard' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-1 leading-none truncate">Dashboard</span>
        </button>

        {/* Dynamic Enabled Categories */}
        {enabledCategories.map(cat => {
          const Icon = getCategoryIconComponent(cat.icon);
          const isActive = currentTab === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setCurrentTab(cat.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-btn min-h-[48px] min-w-[50px] transition-all relative flex-shrink-0 ${
                isActive ? 'text-expense-red font-bold' : 'text-coffee/70 hover:text-coffee font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-expense-red rounded-full animate-fade-in" />
              )}
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] mt-1 leading-none truncate max-w-[60px]">
                {cat.name.split(' ')[0]}
              </span>
            </button>
          );
        })}

        {/* Reports */}
        <button
          onClick={() => setCurrentTab('reports')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-btn min-h-[48px] min-w-[50px] transition-all relative flex-shrink-0 ${
            currentTab === 'reports' ? 'text-expense-red font-bold' : 'text-coffee/70 hover:text-coffee font-medium'
          }`}
        >
          {currentTab === 'reports' && (
            <span className="absolute top-0 w-8 h-1 bg-expense-red rounded-full animate-fade-in" />
          )}
          <ChartNoAxesCombined
            className={`w-5 h-5 transition-transform ${
              currentTab === 'reports' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-1 leading-none truncate">Reports</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-btn min-h-[48px] min-w-[50px] transition-all relative flex-shrink-0 ${
            currentTab === 'settings' ? 'text-expense-red font-bold' : 'text-coffee/70 hover:text-coffee font-medium'
          }`}
        >
          {currentTab === 'settings' && (
            <span className="absolute top-0 w-8 h-1 bg-expense-red rounded-full animate-fade-in" />
          )}
          <Settings
            className={`w-5 h-5 transition-transform ${
              currentTab === 'settings' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-1 leading-none truncate">Settings</span>
        </button>
      </div>
    </nav>
  );
};
