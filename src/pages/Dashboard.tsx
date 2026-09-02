import React from 'react';
import {
  ArrowRight,
  TrendingDown,
  WalletCards,
  Receipt,
  Scale,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getCategoryIconComponent } from '../utils/categoryIcons';
import { useTheme } from '../hooks/useTheme';

const LIGHT_CHART_COLORS = [
  '#3B2314',
  '#8B4A20',
  '#C62828',
  '#E53935',
  '#6D4C41',
  '#8D6E63',
  '#A1887F',
  '#B71C1C',
  '#D32F2F',
];

const DARK_CHART_COLORS = [
  '#E2A572',
  '#F06A5D',
  '#D98544',
  '#F49D5E',
  '#B87A54',
  '#FF856F',
  '#D2A884',
  '#F68576',
  '#E5AF88',
];

export const Dashboard: React.FC = () => {
  const { summary, setCurrentTab, setQuickActionType, categories, selectedMonthData } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const palette = isDark ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

  const enabledCategories = categories.filter(c => c.isEnabled);

  // Dynamic pie chart data
  const chartData = enabledCategories
    .map((cat, index) => {
      let val = 0;
      if (cat.id === 'staff') val = summary.staffTotal;
      else if (cat.id === 'emi') val = summary.emiTotal;
      else if (cat.id === 'shop') val = summary.shopTotal;
      else if (cat.id === 'other') val = summary.otherTotal;
      else {
        const items = selectedMonthData.customExpenses?.[cat.id] || [];
        val = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      }
      return {
        name: cat.name,
        value: val,
        color: palette[index % palette.length],
      };
    })
    .filter(item => item.value > 0);

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* 1. PRIMARY FINANCIAL SUMMARY CARDS (Top priority: Budget, Expense, Balance) */}
      <section aria-label="Financial Summary" className="order-2 md:order-1 grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4.5 lg:gap-6">
        {/* CARD 1: Total Budget (Coffee Brown dominant) */}
        <div className="bg-cream rounded-card p-4 sm:p-5 lg:p-6 border border-border-warm shadow-warm-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-caramel uppercase tracking-wider">
              Total Budget
            </span>
            <div className="w-9 h-9 rounded-lg bg-coffee/10 text-coffee flex items-center justify-center">
              <WalletCards className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-coffee tracking-tight">
              {formatINR(summary.budget)}
            </div>
            <p className="text-[11px] sm:text-xs text-caramel mt-1 font-medium">
              Monthly planned expense limit
            </p>
          </div>
        </div>

        {/* CARD 2: Total Expense (Expense Red) */}
        <div className="bg-cream rounded-card p-4 sm:p-5 lg:p-6 border border-expense-red/30 shadow-warm-sm flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-cream to-expense-red-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-expense-red uppercase tracking-wider">
              Total Expense
            </span>
            <div className="w-9 h-9 rounded-lg bg-expense-red/15 text-expense-red flex items-center justify-center">
              <Receipt className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-expense-red tracking-tight">
              {formatINR(summary.totalExpense)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-expense-red font-semibold mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Sum of all {enabledCategories.length} active categories</span>
            </div>
          </div>
        </div>

        {/* CARD 3: Balance — full width on the second mobile row, normal 3rd column on desktop */}
        <div
          className={`col-span-2 sm:col-span-1 rounded-card p-4 sm:p-5 lg:p-6 border shadow-warm-sm flex flex-col justify-between relative overflow-hidden ${
            summary.isDeficit
              ? 'bg-cream border-expense-red/40 from-cream to-expense-red-50/60'
              : 'bg-cream border-border-warm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                summary.isDeficit ? 'text-expense-red' : 'text-coffee'
              }`}
            >
              Balance
            </span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                summary.isDeficit ? 'bg-expense-red/15 text-expense-red' : 'bg-coffee/10 text-coffee'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${
                summary.isDeficit ? 'text-expense-red' : 'text-coffee'
              }`}
            >
              {formatINR(summary.balance)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  summary.isDeficit ? 'bg-expense-red' : 'bg-coffee'
                }`}
              />
              <span className={summary.isDeficit ? 'text-expense-red' : 'text-coffee'}>
                {summary.isDeficit ? 'Over Budget' : 'Remaining from Budget'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK ADD ACTIONS — rarely used on mobile, so pushed to the bottom
             there; keeps its normal near-top spot on desktop. */}
      <section aria-label="Quick Actions" className="order-last md:order-2">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-bold text-caramel uppercase tracking-wider">
            Quick Add
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 xl:gap-5">
          {enabledCategories.slice(0, 4).map(cat => {
            const Icon = getCategoryIconComponent(cat.icon);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  // Staff come from the Staff-app, so open that screen instead
                  // of a quick-add form (only the amount is editable there).
                  if (['emi', 'shop', 'other'].includes(cat.id)) {
                    setQuickActionType(cat.id);
                  } else {
                    setCurrentTab(cat.id);
                  }
                }}
                className="flex items-center gap-3 p-3.5 sm:p-4 bg-cream hover:bg-cream-dark border border-border-warm rounded-btn font-semibold text-xs sm:text-sm text-coffee transition-all shadow-sm active:scale-[0.98] group"
              >
                <div className="w-8 h-8 rounded-lg bg-coffee text-cream flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. EXPENSE BREAKDOWN CARDS — the primary section: shown first on mobile
             so all categories are visible without scrolling. */}
      <section aria-label="Expense Breakdown" className="order-1 md:order-3">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-expense-red" />
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-coffee tracking-tight">
              Expense Breakdown
            </h3>
          </div>
          <span className="text-xs text-caramel font-medium">{enabledCategories.length} Categories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
          {enabledCategories.map(cat => {
            const Icon = getCategoryIconComponent(cat.icon);
            let catAmount = 0;
            let catCount = 0;

            if (cat.id === 'staff') {
              catAmount = summary.staffTotal;
              catCount = summary.staffCount;
            } else if (cat.id === 'emi') {
              catAmount = summary.emiTotal;
              catCount = summary.emiCount;
            } else if (cat.id === 'shop') {
              catAmount = summary.shopTotal;
              catCount = summary.shopCount;
            } else if (cat.id === 'other') {
              catAmount = summary.otherTotal;
              catCount = summary.otherCount;
            } else {
              const items = selectedMonthData.customExpenses?.[cat.id] || [];
              catAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
              catCount = items.length;
            }

            const staffFixTotal =
              cat.id === 'staff'
                ? (selectedMonthData.staffList || []).reduce(
                    (sum, item) => sum + (Number(item.fixAmount) || 0),
                    0
                  )
                : 0;

            const percentage =
              summary.totalExpense > 0
                ? Math.round((catAmount / summary.totalExpense) * 100)
                : 0;

            return (
              <div
                key={cat.id}
                onClick={() => setCurrentTab(cat.id)}
                className="bg-cream p-4 sm:p-5 rounded-card border border-border-warm shadow-warm-sm hover:shadow-warm-md hover:border-caramel/40 transition-all cursor-pointer group flex flex-col justify-between gap-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-bold text-coffee group-hover:text-coffee-dark truncate leading-tight">
                      {cat.name}
                    </h4>
                    <span className="text-[11px] sm:text-xs text-caramel font-medium">
                      {catCount} records
                    </span>
                  </div>
                  <ArrowRight className="hidden sm:block w-4 h-4 text-caramel group-hover:text-coffee group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>

                <div className="flex items-end justify-between gap-1 pt-3 border-t border-border-warm/60">
                  <span className="text-xs sm:text-sm text-caramel font-semibold">{percentage}%</span>
                  <div className="flex flex-col items-end gap-0.5">
                    {cat.id === 'staff' && staffFixTotal > 0 && (
                      <span className="text-[11px] sm:text-xs text-caramel font-semibold leading-none">
                        Fix: {formatINR(staffFixTotal)}
                      </span>
                    )}
                    <span className="text-lg sm:text-xl font-bold text-expense-red leading-none break-words text-right">
                      {formatINR(catAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. EXPENSE DISTRIBUTION CHART & INSIGHT */}
      <section aria-label="Visual Overview" className="order-3 md:order-4 bg-cream rounded-card p-5 sm:p-6 lg:p-7 border border-border-warm shadow-warm-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-coffee">Category Distribution</h4>
            <p className="text-xs sm:text-sm text-caramel">Visual share of total monthly expense</p>
          </div>
          <button
            onClick={() => setCurrentTab('reports')}
            className="text-xs sm:text-sm font-semibold text-coffee hover:text-expense-red flex items-center gap-1.5 transition-colors"
          >
            <span>Full Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-sm text-caramel">
            No expenses recorded for {selectedMonthData.monthName}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Donut Chart */}
            <div className="lg:col-span-5 h-64 xl:h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatINR(val), 'Amount']}
                    contentStyle={{
                      backgroundColor: isDark ? '#281A12' : '#FFF6ED',
                      borderColor: isDark ? '#63442F' : '#E8D5C4',
                      borderRadius: '12px',
                      color: isDark ? '#F5EBE0' : '#3B2314',
                      fontWeight: '600',
                      boxShadow: isDark
                        ? '0 10px 25px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(245, 235, 224, 0.15)'
                        : '0 4px 12px rgba(59, 35, 20, 0.08)',
                    }}
                    itemStyle={{
                      color: isDark ? '#F5EBE0' : '#3B2314',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {chartData.map((item, idx) => {
                const pct =
                  summary.totalExpense > 0
                    ? Math.round((item.value / summary.totalExpense) * 100)
                    : 0;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-btn bg-warm-beige/40 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-coffee truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-caramel">{pct}%</span>
                      <span className="font-bold text-expense-red">{formatINR(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
