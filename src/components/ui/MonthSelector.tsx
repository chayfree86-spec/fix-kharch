import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { getCurrentMonthKey } from '../../data/mockData';

export const MonthSelector: React.FC = () => {
  const { nextMonth, prevMonth, setMonth, selectedMonthKey } = useApp();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isAll = selectedMonthKey === 'ALL';
  const currentMonthKey = getCurrentMonthKey();
  const [nowY, nowM] = currentMonthKey.split('-').map(Number);

  // Parse current year & month
  let selectedYear = nowY;
  let selectedMonth = nowM;
  if (!isAll && selectedMonthKey && selectedMonthKey.includes('-')) {
    const parts = selectedMonthKey.split('-').map(Number);
    if (parts[0] && parts[1]) {
      selectedYear = parts[0];
      selectedMonth = parts[1];
    }
  }

  const months = [
    { num: 1, name: 'Jan', fullName: 'January' },
    { num: 2, name: 'Feb', fullName: 'February' },
    { num: 3, name: 'Mar', fullName: 'March' },
    { num: 4, name: 'Apr', fullName: 'April' },
    { num: 5, name: 'May', fullName: 'May' },
    { num: 6, name: 'Jun', fullName: 'June' },
    { num: 7, name: 'Jul', fullName: 'July' },
    { num: 8, name: 'Aug', fullName: 'August' },
    { num: 9, name: 'Sep', fullName: 'September' },
    { num: 10, name: 'Oct', fullName: 'October' },
    { num: 11, name: 'Nov', fullName: 'November' },
    { num: 12, name: 'Dec', fullName: 'December' },
  ];

  const [pickerYear, setPickerYear] = useState(selectedYear);

  const shortMonthLabel = isAll
    ? 'All Months'
    : `${months.find(m => m.num === selectedMonth)?.name || ''} ${selectedYear}`;

  const handleSelectMonth = (monthNum: number) => {
    const key = `${pickerYear}-${monthNum.toString().padStart(2, '0')}`;
    setMonth(key);
    setIsPickerOpen(false);
  };

  const handleSelectAll = () => {
    setMonth('ALL');
    setIsPickerOpen(false);
  };

  const handleSelectCurrentMonth = () => {
    setMonth(currentMonthKey);
    setIsPickerOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between bg-cream px-1 sm:px-2 py-1 sm:py-1.5 rounded-card border border-border-warm shadow-warm-sm">
        <button
          onClick={prevMonth}
          aria-label="Previous Month"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-btn flex items-center justify-center text-coffee hover:bg-warm-beige/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-coffee/20 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={() => {
            setPickerYear(selectedYear);
            setIsPickerOpen(true);
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-1.5 rounded-btn hover:bg-warm-beige/50 text-coffee transition-colors font-semibold text-xs sm:text-base focus:outline-none min-w-0"
        >
          {isAll ? (
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-caramel flex-shrink-0" />
          ) : (
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-caramel flex-shrink-0" />
          )}
          <span className="whitespace-nowrap">{shortMonthLabel}</span>
        </button>

        <button
          onClick={nextMonth}
          aria-label="Next Month"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-btn flex items-center justify-center text-coffee hover:bg-warm-beige/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-coffee/20 flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Month Picker Modal */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Select Time Period"
        subtitle="Choose All Months or a custom month & year"
        maxWidth="sm"
      >
        {/* Quick Presets: All Months & This Month */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={handleSelectAll}
            className={`py-2.5 px-3 rounded-btn text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isAll
                ? 'bg-coffee text-cream shadow-warm-sm ring-2 ring-coffee/20'
                : 'bg-warm-beige/60 hover:bg-warm-beige text-coffee border border-border-warm/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-caramel" />
            <span>All Months</span>
          </button>

          <button
            type="button"
            onClick={handleSelectCurrentMonth}
            className={`py-2.5 px-3 rounded-btn text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !isAll && selectedMonthKey === currentMonthKey
                ? 'bg-coffee text-cream shadow-warm-sm ring-2 ring-coffee/20'
                : 'bg-warm-beige/60 hover:bg-warm-beige text-coffee border border-border-warm/70'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-caramel" />
            <span>This Month</span>
          </button>
        </div>

        {/* Custom Month Header & Year Selector */}
        <div className="text-xs font-bold uppercase tracking-wider text-caramel mb-2 flex items-center justify-between">
          <span>Custom Month Selection</span>
        </div>

        <div className="flex items-center justify-between bg-warm-beige/60 p-2 rounded-btn mb-3">
          <button
            type="button"
            onClick={() => setPickerYear(prev => prev - 1)}
            className="w-8 h-8 rounded-full bg-cream text-coffee flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-bold text-coffee">{pickerYear}</span>
          <button
            type="button"
            onClick={() => setPickerYear(prev => prev + 1)}
            className="w-8 h-8 rounded-full bg-cream text-coffee flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {months.map(m => {
            const isSelected = !isAll && pickerYear === selectedYear && m.num === selectedMonth;
            return (
              <button
                key={m.num}
                type="button"
                onClick={() => handleSelectMonth(m.num)}
                className={`py-3 px-2 rounded-btn text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-coffee text-cream shadow-warm-sm ring-2 ring-coffee/20'
                    : 'bg-warm-beige/40 hover:bg-warm-beige text-coffee'
                }`}
              >
                {m.fullName}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
};
