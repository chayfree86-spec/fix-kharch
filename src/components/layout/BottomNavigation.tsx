import React from 'react';
import { LayoutDashboard, Store, ChartNoAxesCombined, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BottomNavigationProps {
  onMoreClick: () => void;
  isMoreOpen: boolean;
}

const NavButton: React.FC<{
  active: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}> = ({ active, label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-btn flex-1 min-h-[52px] transition-all relative active:scale-95 ${
      active ? 'text-expense-red' : 'text-coffee/65 active:text-coffee'
    }`}
  >
    {active && <span className="absolute top-0 w-8 h-1 bg-expense-red rounded-full animate-fade-in" />}
    <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
    <span className={`text-[10px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </button>
);

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onMoreClick, isMoreOpen }) => {
  const { currentTab, setCurrentTab, categories } = useApp();

  // "Shop" is the café's primary day-to-day expense screen — keep it one tap
  // away. Fall back to the first enabled non-staff category if it's been
  // renamed/disabled, so the nav never breaks for a customized category set.
  const shopCategory =
    categories.find(c => c.id === 'shop' && c.isEnabled) ||
    categories.find(c => c.isEnabled && c.id !== 'staff');

  const primaryTabIds = new Set(['dashboard', 'reports', shopCategory?.id]);
  const isOnMoreSection = !primaryTabIds.has(currentTab);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-t border-border-warm md:hidden shadow-warm-lg safe-bottom no-x-overflow"
    >
      <div className="flex items-stretch px-1.5 py-1">
        <NavButton
          active={currentTab === 'dashboard'}
          label="Dashboard"
          icon={LayoutDashboard}
          onClick={() => setCurrentTab('dashboard')}
        />
        {shopCategory && (
          <NavButton
            active={currentTab === shopCategory.id}
            label={shopCategory.name.split(' ')[0]}
            icon={Store}
            onClick={() => setCurrentTab(shopCategory.id)}
          />
        )}
        <NavButton
          active={currentTab === 'reports'}
          label="Reports"
          icon={ChartNoAxesCombined}
          onClick={() => setCurrentTab('reports')}
        />
        <NavButton active={isMoreOpen || isOnMoreSection} label="More" icon={Menu} onClick={onMoreClick} />
      </div>
    </nav>
  );
};
