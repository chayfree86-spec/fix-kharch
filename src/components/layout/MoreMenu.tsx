import React from 'react';
import { ChevronRight, Settings, ChartNoAxesCombined } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { getCategoryIconComponent } from '../../utils/categoryIcons';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Categories already reachable from the primary bottom nav — don't repeat here.
const PRIMARY_TAB_IDS = new Set(['staff', 'emi', 'shop']);

export const MoreMenu: React.FC<MoreMenuProps> = ({ isOpen, onClose }) => {
  const { categories, setCurrentTab, selectedMonthData, summary } = useApp();

  const menuCategories = categories.filter(c => c.isEnabled && !PRIMARY_TAB_IDS.has(c.id));

  const countFor = (catId: string) => {
    if (catId === 'other') return summary.otherCount;
    return (selectedMonthData.customExpenses?.[catId] || []).length;
  };

  const go = (tab: string) => {
    setCurrentTab(tab);
    onClose();
  };

  const Row: React.FC<{
    icon: React.ElementType;
    title: string;
    subtitle: string;
    onClick: () => void;
  }> = ({ icon: Icon, title, subtitle, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-3.5 text-left active:bg-warm-beige/50 transition-colors rounded-btn"
    >
      <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-coffee truncate">{title}</h4>
        <p className="text-xs text-caramel truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-caramel flex-shrink-0" />
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="More" subtitle="More café expense sections" maxWidth="sm">
      <div className="-mx-1 divide-y divide-border-warm/60">
        {menuCategories.map(cat => (
          <Row
            key={cat.id}
            icon={getCategoryIconComponent(cat.icon)}
            title={cat.name}
            subtitle={cat.description || `${countFor(cat.id)} records this month`}
            onClick={() => go(cat.id)}
          />
        ))}

        {/* Reports & Settings — always present */}
        <Row
          icon={ChartNoAxesCombined}
          title="Reports & Analytics"
          subtitle="Expense distribution & insights"
          onClick={() => go('reports')}
        />
        <Row
          icon={Settings}
          title="Settings"
          subtitle="Café profile, budget & categories"
          onClick={() => go('settings')}
        />
      </div>
    </Modal>
  );
};
