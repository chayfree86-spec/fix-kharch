import React from 'react';
import { ChevronRight, Settings } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { getCategoryIconComponent } from '../../utils/categoryIcons';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Categories already reachable from the primary bottom nav — don't repeat them here.
const PRIMARY_TAB_IDS = new Set(['shop']);

export const MoreMenu: React.FC<MoreMenuProps> = ({ isOpen, onClose }) => {
  const { categories, setCurrentTab, selectedMonthData, summary } = useApp();

  const menuCategories = categories.filter(c => c.isEnabled && !PRIMARY_TAB_IDS.has(c.id));

  const countFor = (catId: string) => {
    if (catId === 'staff') return summary.staffCount;
    if (catId === 'emi') return summary.emiCount;
    if (catId === 'other') return summary.otherCount;
    return (selectedMonthData.customExpenses?.[catId] || []).length;
  };

  const go = (tab: string) => {
    setCurrentTab(tab);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="More" subtitle="All café expense sections" maxWidth="sm">
      <div className="-mx-1 divide-y divide-border-warm/60">
        {menuCategories.map(cat => {
          const Icon = getCategoryIconComponent(cat.icon);
          const count = countFor(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => go(cat.id)}
              className="w-full flex items-center gap-3 px-2 py-3.5 text-left active:bg-warm-beige/50 transition-colors rounded-btn"
            >
              <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-coffee truncate">{cat.name}</h4>
                <p className="text-xs text-caramel truncate">
                  {cat.description || `${count} records this month`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-caramel flex-shrink-0" />
            </button>
          );
        })}

        {/* Settings — always present */}
        <button
          type="button"
          onClick={() => go('settings')}
          className="w-full flex items-center gap-3 px-2 py-3.5 text-left active:bg-warm-beige/50 transition-colors rounded-btn"
        >
          <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-coffee truncate">Settings</h4>
            <p className="text-xs text-caramel truncate">Café profile, budget & categories</p>
          </div>
          <ChevronRight className="w-5 h-5 text-caramel flex-shrink-0" />
        </button>
      </div>
    </Modal>
  );
};
