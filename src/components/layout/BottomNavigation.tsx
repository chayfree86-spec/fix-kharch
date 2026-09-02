import React from 'react';
import { LayoutDashboard, UsersRound, Landmark, Store, Menu } from 'lucide-react';
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
    className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-btn flex-1 min-w-0 min-h-[52px] transition-all relative active:scale-95 ${
      active ? 'text-expense-red' : 'text-coffee/65 active:text-coffee'
    }`}
  >
    {active && <span className="absolute top-0 w-7 h-1 bg-expense-red rounded-full animate-fade-in" />}
    <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
    <span className={`text-[10px] leading-none truncate max-w-full px-0.5 ${active ? 'font-bold' : 'font-medium'}`}>
      {label}
    </span>
  </button>
);

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onMoreClick, isMoreOpen }) => {
  const { currentTab, setCurrentTab, categories } = useApp();

  // The three main data-entry expense screens live in the footer alongside
  // Dashboard and More. Look them up so a disabled/renamed category won't break
  // the nav. Reports and other sections live in the More menu.
  const findCat = (id: string) => categories.find(c => c.id === id && c.isEnabled);
  const staff = findCat('staff');
  const emi = findCat('emi');
  const shop = findCat('shop');

  const footerIds = new Set(['dashboard', staff?.id, emi?.id, shop?.id]);
  const isOnMoreSection = !footerIds.has(currentTab);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-t border-border-warm md:hidden shadow-warm-lg safe-bottom no-x-overflow"
    >
      <div className="flex items-stretch px-1 py-1">
        <NavButton
          active={currentTab === 'dashboard'}
          label="Dashboard"
          icon={LayoutDashboard}
          onClick={() => setCurrentTab('dashboard')}
        />
        {staff && (
          <NavButton
            active={currentTab === staff.id}
            label="Staff"
            icon={UsersRound}
            onClick={() => setCurrentTab(staff.id)}
          />
        )}
        {emi && (
          <NavButton
            active={currentTab === emi.id}
            label="Bank"
            icon={Landmark}
            onClick={() => setCurrentTab(emi.id)}
          />
        )}
        {shop && (
          <NavButton
            active={currentTab === shop.id}
            label="Shop"
            icon={Store}
            onClick={() => setCurrentTab(shop.id)}
          />
        )}
        <NavButton active={isMoreOpen || isOnMoreSection} label="More" icon={Menu} onClick={onMoreClick} />
      </div>
    </nav>
  );
};
