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

const CHART_COLORS = [
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

export const Dashboard: React.FC = () => {
  const { summary, setCurrentTab, setQuickActionType, categories, selectedMonthData } = useApp();

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
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    })
    .filter(item => item.value > 0);

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-4">
      {/* 1. PRIMARY FINANCIAL SUMMARY CARDS (Top priority: Budget, Expense, Balance) */}
      <section aria-label="Financial Summary" className="order-2 md:order-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* CARD 1: Total Budget (Coffee Brown dominant) */}
        <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-caramel uppercase tracking-wider">
              Total Budget
            </span>
            <div className="w-8 h-8 rounded-lg bg-coffee/10 text-coffee flex items-center justify-center">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-coffee tracking-tight">
              {formatINR(summary.budget)}
            </div>
            <p className="text-[11px] text-caramel mt-1 font-medium">
              Monthly planned expense limit
            </p>
          </div>
        </div>

        {/* CARD 2: Total Expense (Expense Red) */}
        <div className="bg-cream rounded-card p-4 sm:p-5 border border-expense-red/30 shadow-warm-sm flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-cream to-expense-red-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-expense-red uppercase tracking-wider">
              Total Expense
            </span>
            <div className="w-8 h-8 rounded-lg bg-expense-red/15 text-expense-red flex items-center justify-center">
              <Receipt className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-expense-red tracking-tight">
              {formatINR(summary.totalExpense)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-expense-red font-semibold mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Sum of all {enabledCategories.length} active categories</span>
            </div>
          </div>
        </div>

        {/* CARD 3: Balance — full width on the second mobile row, normal 3rd column on desktop */}
        <div
          className={`col-span-2 sm:col-span-1 rounded-card p-4 sm:p-5 border shadow-warm-sm flex flex-col justify-between relative overflow-hidden ${
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
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                summary.isDeficit ? 'bg-expense-red/15 text-expense-red' : 'bg-coffee/10 text-coffee'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                summary.isDeficit ? 'text-expense-red' : 'text-coffee'
              }`}
            >
              {formatINR(summary.balance)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-1">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                className="flex items-center gap-2 p-3 bg-cream hover:bg-cream-dark border border-border-warm rounded-btn font-semibold text-xs text-coffee transition-all shadow-sm active:scale-[0.98] group"
              >
                <div className="w-7 h-7 rounded-lg bg-coffee text-cream flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
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
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-expense-red" />
            <h3 className="text-base sm:text-lg font-bold text-coffee tracking-tight">
              Expense Breakdown
            </h3>
          </div>
          <span className="text-xs text-caramel font-medium">{enabledCategories.length} Categories</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
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

            const percentage =
              summary.totalExpense > 0
                ? Math.round((catAmount / summary.totalExpense) * 100)
                : 0;

            return (
              <div
                key={cat.id}
                onClick={() => setCurrentTab(cat.id)}
                className="bg-cream p-3.5 sm:p-4 rounded-card border border-border-warm shadow-warm-sm hover:shadow-warm-md hover:border-caramel/40 transition-all cursor-pointer group flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-coffee group-hover:text-coffee-dark truncate leading-tight">
                      {cat.name}
                    </h4>
                    <span className="text-[11px] sm:text-xs text-caramel font-medium">
                      {catCount} records
                    </span>
                  </div>
                  <ArrowRight className="hidden sm:block w-4 h-4 text-caramel group-hover:text-coffee group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>

                <div className="flex items-end justify-between gap-1 pt-2.5 border-t border-border-warm/60">
                  <span className="text-[11px] sm:text-xs text-caramel font-semibold">{percentage}%</span>
                  <span className="text-lg font-bold text-expense-red leading-none break-words text-right">
                    {formatINR(catAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. EXPENSE DISTRIBUTION CHART & INSIGHT */}
      <section aria-label="Visual Overview" className="order-3 md:order-4 bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-coffee">Category Distribution</h4>
            <p className="text-xs text-caramel">Visual share of total monthly expense</p>
          </div>
          <button
            onClick={() => setCurrentTab('reports')}
            className="text-xs font-semibold text-coffee hover:text-expense-red flex items-center gap-1 transition-colors"
          >
            <span>Full Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {chartData.length === 0 ? (
          <div className="py-8 text-center text-xs text-caramel">
            No expenses recorded for {selectedMonthData.monthName}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Donut Chart */}
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
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
                      backgroundColor: '#FFF6ED',
                      borderColor: '#E8D5C4',
                      borderRadius: '12px',
                      color: '#3B2314',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(59, 35, 20, 0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {chartData.map((item, idx) => {
                const pct =
                  summary.totalExpense > 0
                    ? Math.round((item.value / summary.totalExpense) * 100)
                    : 0;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-btn bg-warm-beige/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
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
