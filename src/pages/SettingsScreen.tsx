import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Coffee,
  Palette,
  Info,
  RotateCcw,
  Check,
  Save,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Logo } from '../components/ui/Logo';
import { ExpenseCategory } from '../types';
import { AVAILABLE_ICONS, getCategoryIconComponent } from '../utils/categoryIcons';
import { clearAllAppCacheAndReload } from '../utils/autoUpdater';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateBudget,
    selectedMonthData,
    resetToDefaults,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    summary,
    user,
    logout,
  } = useApp();

  const [cafeName, setCafeName] = useState(settings.cafeName);
  const [budget, setBudget] = useState<number>(selectedMonthData.budget);
  const [businessId, setBusinessId] = useState<string>(
    settings.staffBusinessId != null ? String(settings.staffBusinessId) : ''
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('layers');
  const [catError, setCatError] = useState('');

  // Category Delete Confirm
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [deletingCatName, setDeletingCatName] = useState('');

  // Keep the form in sync with data that loads asynchronously from the server.
  React.useEffect(() => {
    setCafeName(settings.cafeName);
    setBusinessId(settings.staffBusinessId != null ? String(settings.staffBusinessId) : '');
  }, [settings.cafeName, settings.staffBusinessId]);

  React.useEffect(() => {
    setBudget(selectedMonthData.budget);
  }, [selectedMonthData.budget, selectedMonthData.monthKey]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (cafeName.trim()) {
      updateSettings({ cafeName: cafeName.trim() });
    }
    updateBudget(budget);
    updateSettings({
      defaultMonthlyBudget: budget,
      staffBusinessId: businessId.trim() === '' ? null : Number(businessId.trim()),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    resetToDefaults();
    setIsResetConfirmOpen(false);
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatIcon('layers');
    setCatError('');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatIcon(cat.icon);
    setCatError('');
    setIsCatModalOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError('Please enter a category name');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        icon: catIcon,
      });
    } else {
      addCategory({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        icon: catIcon,
        isEnabled: true,
      });
    }

    setIsCatModalOpen(false);
  };

  const handlePromptDeleteCategory = (cat: ExpenseCategory) => {
    setDeletingCatId(cat.id);
    setDeletingCatName(cat.name);
  };

  const handleConfirmDeleteCategory = () => {
    if (deletingCatId) {
      deleteCategory(deletingCatId);
      setDeletingCatId(null);
    }
  };

  return (
    <div className="space-y-5 pb-6 w-full">
      {/* Header Banner - Full Width */}
      <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-coffee">Settings & Control Center</h2>
            <p className="text-xs text-caramel">
              Manage café budget, customize expense categories, and brand profile
            </p>
          </div>
        </div>

        <div className="bg-warm-beige/70 px-4 py-2 rounded-btn border border-border-warm/60 flex items-center gap-2">
          <span className="text-xs font-semibold text-caramel uppercase tracking-wider">
            Active Categories:
          </span>
          <span className="text-sm font-bold text-coffee">
            {categories.filter(c => c.isEnabled).length} of {categories.length}
          </span>
        </div>
      </div>

      {/* 1. EXPENSE CATEGORIES CONTROL CENTER - Full Width Card */}
      <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-warm/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-coffee/10 text-coffee flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-coffee uppercase tracking-wider">
                Expense Categories Control
              </h3>
              <p className="text-xs text-caramel">
                Create, rename, toggle on/off, or delete expense categories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddCategory}
            className="h-10 px-4 bg-expense-red hover:bg-expense-red-dark text-cream rounded-btn font-semibold text-xs flex items-center gap-1.5 shadow-warm-sm transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Category</span>
          </button>
        </div>

        {/* Categories Grid - Multi-column on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {categories.map(cat => {
            const Icon = getCategoryIconComponent(cat.icon);
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
              <div
                key={cat.id}
                className={`p-4 rounded-card border transition-all flex items-center justify-between gap-3 ${
                  cat.isEnabled
                    ? 'bg-warm-beige/35 border-border-warm hover:border-caramel/40 shadow-warm-sm'
                    : 'bg-warm-beige/10 border-border-warm/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      cat.isEnabled ? 'bg-coffee text-cream' : 'bg-warm-beige text-coffee/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-coffee truncate">{cat.name}</h4>
                      {cat.isDefault ? (
                        <span className="text-[10px] bg-warm-beige/80 text-caramel px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                          Default
                        </span>
                      ) : (
                        <span className="text-[10px] bg-coffee/10 text-coffee px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-caramel truncate">
                      {cat.description || `${count} items this month`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    title={cat.isEnabled ? 'Disable Category (Hide from Menu)' : 'Enable Category (Show in Menu)'}
                    aria-label={cat.isEnabled ? 'Disable Category' : 'Enable Category'}
                    className={`w-9 h-9 rounded-btn flex items-center justify-center transition-colors ${
                      cat.isEnabled
                        ? 'bg-warm-beige text-coffee hover:bg-warm-beige-dark'
                        : 'bg-warm-beige/60 text-coffee/40 hover:bg-warm-beige'
                    }`}
                  >
                    {cat.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditCategory(cat)}
                    title="Edit Category"
                    aria-label="Edit Category"
                    className="w-9 h-9 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee flex items-center justify-center transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete (only for custom categories) */}
                  {!cat.isDefault && (
                    <button
                      type="button"
                      onClick={() => handlePromptDeleteCategory(cat)}
                      title="Delete Category"
                      aria-label="Delete Category"
                      className="w-9 h-9 rounded-btn bg-warm-beige hover:bg-expense-red-50 text-expense-red flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LOWER SECTION: TWO-COLUMN FULL-WIDTH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left Column: Business Profile & Monthly Target Budget */}
        <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-warm/60 pb-3">
            <div className="w-8 h-8 rounded-lg bg-coffee/10 text-coffee flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-coffee uppercase tracking-wider">Business Profile</h3>
              <p className="text-xs text-caramel">Set your café branding & monthly budget limit</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
                Café Name
              </label>
              <input
                type="text"
                value={cafeName}
                onChange={e => setCafeName(e.target.value)}
                placeholder="e.g. Fix Spend Café"
                className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
              />
            </div>

            <CurrencyInput
              label="Monthly Budget Target"
              value={budget}
              onChange={setBudget}
              placeholder="0"
              helperText={`Current target budget for ${selectedMonthData.monthName}`}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
                Staff-app Business ID
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={businessId}
                onChange={e => setBusinessId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 1 — links your staff roster"
                className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
              />
              <p className="text-[11px] text-caramel">
                Pulls staff & fixed salaries from the Staff-app attendance system.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              {isSaved ? (
                <span className="text-xs font-semibold text-coffee flex items-center gap-1.5 animate-fade-in bg-warm-beige/60 px-3 py-1.5 rounded-btn">
                  <Check className="w-4 h-4 text-caramel stroke-[3]" /> Settings Saved Successfully!
                </span>
              ) : (
                <div />
              )}
              <button
                type="submit"
                className="h-11 px-5 bg-coffee hover:bg-coffee-dark text-cream rounded-btn font-semibold text-sm flex items-center gap-2 shadow-warm-sm transition-all active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Brand Palette & About/Reset */}
        <div className="space-y-5">
          {/* Brand System Card */}
          <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-3">
            <div className="flex items-center gap-2.5 border-b border-border-warm/60 pb-3">
              <div className="w-8 h-8 rounded-lg bg-caramel/10 text-caramel flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-coffee uppercase tracking-wider">Brand System</h3>
                <p className="text-xs text-caramel">Visual color harmony & brand psychology</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div className="bg-[#3B2314] text-cream p-2.5 rounded-btn text-center text-xs">
                <span className="font-bold block">#3B2314</span>
                <span className="text-[10px] opacity-80">Coffee Brown</span>
              </div>
              <div className="bg-[#8B4A20] text-cream p-2.5 rounded-btn text-center text-xs">
                <span className="font-bold block">#8B4A20</span>
                <span className="text-[10px] opacity-80">Caramel</span>
              </div>
              <div className="bg-[#F5E6D3] text-coffee p-2.5 rounded-btn text-center text-xs border border-border-warm">
                <span className="font-bold block">#F5E6D3</span>
                <span className="text-[10px] text-caramel">Warm Beige</span>
              </div>
              <div className="bg-[#FFF6ED] text-coffee p-2.5 rounded-btn text-center text-xs border border-border-warm">
                <span className="font-bold block">#FFF6ED</span>
                <span className="text-[10px] text-caramel">Light Cream</span>
              </div>
              <div className="bg-[#C62828] text-cream p-2.5 rounded-btn text-center text-xs">
                <span className="font-bold block">#C62828</span>
                <span className="text-[10px] opacity-80">Expense Red</span>
              </div>
            </div>
          </div>

          {/* About Application & Reset Section */}
          <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-warm/60 pb-3">
              <div className="w-8 h-8 rounded-lg bg-coffee/10 text-coffee flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-coffee uppercase tracking-wider">About Application</h3>
                <p className="text-xs text-caramel">Fix Spend Café Expense Manager v1.0</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div>
                <h4 className="text-sm font-bold text-coffee">Fix Spend - PWA</h4>
                <p className="text-xs text-caramel">Production Grade Fixed Expense Tracker</p>
              </div>
            </div>

            {/* Clear Browser Cache & Fresh Reload */}
            <div className="pt-2 border-t border-border-warm/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-coffee block">Auto Cache Purge & Force Refresh</span>
                <span className="text-[11px] text-caramel block">Clear browser cache & reload fresh code</span>
              </div>
              <button
                type="button"
                onClick={() => clearAllAppCacheAndReload()}
                className="px-3.5 py-2 rounded-btn bg-coffee hover:bg-coffee-dark text-cream text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Cache & Reload</span>
              </button>
            </div>

            {/* Reload / Reset Application Data */}
            <div className="pt-2 border-t border-border-warm/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-coffee block">Reload Data from Server</span>
                <span className="text-[11px] text-caramel block">Discard local changes & refetch everything</span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3.5 py-2 rounded-btn bg-warm-beige hover:bg-expense-red-50 text-expense-red text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-border-warm self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Data</span>
              </button>
            </div>

            {/* Account / Logout */}
            <div className="pt-2 border-t border-border-warm/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-coffee block">
                  {user ? `Signed in as ${user.name}` : 'Account'}
                </span>
                <span className="text-[11px] text-caramel block">
                  {user?.email || user?.mobile || 'End your session on this device'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="px-3.5 py-2 rounded-btn bg-coffee hover:bg-coffee-dark text-cream text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto active:scale-[0.98]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Edit Expense Category' : 'Add New Expense Category'}
        subtitle="Custom category will automatically appear in Menu & Dashboard"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
              Category Name <span className="text-expense-red">*</span>
            </label>
            <input
              type="text"
              value={catName}
              onChange={e => {
                setCatName(e.target.value);
                if (catError) setCatError('');
              }}
              placeholder="e.g. Raw Materials, Vendor, Marketing"
              className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
              Short Description / Subtitle
            </label>
            <input
              type="text"
              value={catDesc}
              onChange={e => setCatDesc(e.target.value)}
              placeholder="e.g. Milk, Coffee Beans, Bakery Supplies"
              className="w-full h-12 px-4 bg-cream border border-border-warm rounded-btn text-sm text-coffee-dark placeholder:text-coffee/35 focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all shadow-sm"
            />
          </div>

          {/* Icon Selector Grid */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-coffee">
              Select Category Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-warm-beige/30 border border-border-warm rounded-btn">
              {AVAILABLE_ICONS.map(item => {
                const Icon = item.icon;
                const isSelected = catIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCatIcon(item.id)}
                    className={`p-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-coffee text-cream shadow-sm scale-105 ring-2 ring-coffee/40'
                        : 'bg-cream text-coffee hover:bg-warm-beige/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-medium truncate w-full text-center">
                      {item.label.split('/')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {catError && (
            <p className="text-xs font-semibold text-expense-red bg-expense-red/10 p-2.5 rounded-btn animate-fade-in">
              {catError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="flex-1 h-12 rounded-btn bg-warm-beige hover:bg-warm-beige-dark text-coffee font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-btn bg-expense-red hover:bg-expense-red-dark text-cream font-semibold text-sm shadow-warm-sm transition-all active:scale-[0.98]"
            >
              {editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCatId}
        onClose={() => setDeletingCatId(null)}
        onConfirm={handleConfirmDeleteCategory}
        title="Delete Expense Category?"
        message={`Are you sure you want to delete "${deletingCatName}" and all of its recorded expenses? This action cannot be undone.`}
        confirmText="Delete Category"
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Reload Data from Server?"
        message="This discards any unsaved local changes and reloads your settings, categories and current month fresh from the server."
        confirmText="Reload Data"
      />
    </div>
  );
};
