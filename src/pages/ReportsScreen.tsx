import React from 'react';
import {
  ChartNoAxesCombined,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { getCategoryIconComponent } from '../utils/categoryIcons';

const CHART_PALETTE = [
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

export const ReportsScreen: React.FC = () => {
  const { summary, selectedMonthData, categories } = useApp();

  const enabledCategories = categories.filter(c => c.isEnabled);

  const categoryDistribution = enabledCategories.map((cat, idx) => {
    let catAmount = 0;
    if (cat.id === 'staff') catAmount = summary.staffTotal;
    else if (cat.id === 'emi') catAmount = summary.emiTotal;
    else if (cat.id === 'shop') catAmount = summary.shopTotal;
    else if (cat.id === 'other') catAmount = summary.otherTotal;
    else {
      const items = selectedMonthData.customExpenses?.[cat.id] || [];
      catAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    }

    return {
      id: cat.id,
      name: cat.name,
      value: catAmount,
      color: CHART_PALETTE[idx % CHART_PALETTE.length],
      iconName: cat.icon,
    };
  });

  const activeCategoryData = categoryDistribution.filter(c => c.value > 0);

  // Comparison bar chart data
  const comparisonData = categoryDistribution.map(cat => ({
    category: cat.name.split(' ')[0],
    fullName: cat.name,
    amount: cat.value,
    fill: cat.color,
  }));

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Header */}
      <div className="bg-cream rounded-card p-4 sm:p-5 border border-border-warm shadow-warm-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-coffee text-cream flex items-center justify-center shadow-sm">
            <ChartNoAxesCombined className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-coffee">Reports & Analytics</h2>
            <p className="text-xs text-caramel">
              Expense breakdown & distribution for {selectedMonthData.monthName} ({enabledCategories.length} Categories)
            </p>
          </div>
        </div>
      </div>

      {/* 1. Monthly Financial Snapshot Summary Card */}
      <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-warm/60 pb-3">
          <div>
            <span className="text-xs font-bold text-caramel uppercase tracking-wider">
              {selectedMonthData.monthName}
            </span>
            <h3 className="text-lg font-bold text-coffee mt-0.5">Monthly Financial Summary</h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              summary.isDeficit ? 'bg-expense-red/10 text-expense-red' : 'bg-coffee/10 text-coffee'
            }`}
          >
            {summary.isDeficit ? 'Deficit' : 'Balanced'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-warm-beige/50 p-3.5 rounded-btn border border-border-warm/40">
            <span className="text-[11px] font-bold text-caramel uppercase tracking-wider block">
              Total Budget
            </span>
            <span className="text-xl font-bold text-coffee mt-1 block">
              {formatINR(summary.budget)}
            </span>
          </div>

          <div className="bg-expense-red-50/60 p-3.5 rounded-btn border border-expense-red/20">
            <span className="text-[11px] font-bold text-expense-red uppercase tracking-wider block">
              Total Expense
            </span>
            <span className="text-xl font-bold text-expense-red mt-1 block">
              {formatINR(summary.totalExpense)}
            </span>
          </div>

          <div
            className={`p-3.5 rounded-btn border ${
              summary.isDeficit
                ? 'bg-expense-red-50/80 border-expense-red/30'
                : 'bg-warm-beige/50 border-border-warm/40'
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                summary.isDeficit ? 'text-expense-red' : 'text-caramel'
              }`}
            >
              Net Balance
            </span>
            <span
              className={`text-xl font-bold mt-1 block ${
                summary.isDeficit ? 'text-expense-red' : 'text-coffee'
              }`}
            >
              {formatINR(summary.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Share Donut Chart */}
        <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-border-warm/60 pb-3">
            <PieIcon className="w-4 h-4 text-caramel" />
            <h4 className="text-sm font-bold text-coffee uppercase tracking-wider">
              Category Distribution
            </h4>
          </div>

          {activeCategoryData.length === 0 ? (
            <div className="py-12 text-center text-xs text-caramel">No expense data available</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activeCategoryData.map((entry, index) => (
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
          )}
        </div>

        {/* Category Comparison Bar Chart */}
        <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-border-warm/60 pb-3">
            <BarChart3 className="w-4 h-4 text-caramel" />
            <h4 className="text-sm font-bold text-coffee uppercase tracking-wider">
              Category Comparison
            </h4>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C4" opacity={0.6} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: '#8B4A20', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#E8D5C4' }}
                />
                <YAxis
                  tick={{ fill: '#8B4A20', fontSize: 11 }}
                  axisLine={{ stroke: '#E8D5C4' }}
                  tickFormatter={val => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: number) => [formatINR(val), 'Expense']}
                  labelFormatter={label => `Category: ${label}`}
                  contentStyle={{
                    backgroundColor: '#FFF6ED',
                    borderColor: '#E8D5C4',
                    borderRadius: '12px',
                    color: '#3B2314',
                    fontWeight: '600',
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Detailed Category Breakdown Table */}
      <div className="bg-cream rounded-card p-5 border border-border-warm shadow-warm-sm space-y-3">
        <h4 className="text-sm font-bold text-coffee uppercase tracking-wider border-b border-border-warm/60 pb-3">
          Category Summary Table
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-warm bg-warm-beige/50 text-xs font-bold text-coffee uppercase tracking-wider">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Monthly Expense</th>
                <th className="py-3 px-4">% Share</th>
                <th className="py-3 px-4 text-right">Items Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm/60">
              {categoryDistribution.map((cat, idx) => {
                const Icon = getCategoryIconComponent(cat.iconName);
                const pct =
                  summary.totalExpense > 0 ? ((cat.value / summary.totalExpense) * 100).toFixed(1) : '0.0';

                let count = 0;
                if (cat.id === 'staff') count = summary.staffCount;
                else if (cat.id === 'emi') count = summary.emiCount;
                else if (cat.id === 'shop') count = summary.shopCount;
                else if (cat.id === 'other') count = summary.otherCount;
                else count = (selectedMonthData.customExpenses?.[cat.id] || []).length;

                return (
                  <tr key={idx} className="hover:bg-warm-beige/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-coffee">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-warm-beige text-coffee flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-expense-red">{formatINR(cat.value)}</td>
                    <td className="py-3 px-4 font-semibold text-caramel">{pct}%</td>
                    <td className="py-3 px-4 text-right font-medium text-coffee">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
