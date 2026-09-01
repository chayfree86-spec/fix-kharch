import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';

export const MonthSelector: React.FC = () => {
  const { selectedMonthData, nextMonth, prevMonth, setMonth, selectedMonthKey } = useApp();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Parse current year & month
  const [currentYearStr, currentMonthStr] = selectedMonthKey.split('-');
  const selectedYear = parseInt(currentYearStr, 10);
  const selectedMonth = parseInt(currentMonthStr, 10);

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

  const handleSelectMonth = (monthNum: number) => {
    const key = `${pickerYear}-${monthNum.toString().padStart(2, '0')}`;
    setMonth(key);
    setIsPickerOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between bg-cream px-2 py-1.5 rounded-card border border-border-warm shadow-warm-sm">
        <button
          onClick={prevMonth}
          aria-label="Previous Month"
          className="w-9 h-9 rounded-btn flex items-center justify-center text-coffee hover:bg-warm-beige/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-coffee/20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setPickerYear(selectedYear);
            setIsPickerOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-btn hover:bg-warm-beige/50 text-coffee transition-colors font-semibold text-sm sm:text-base focus:outline-none"
        >
          <Calendar className="w-4 h-4 text-caramel" />
          <span>{selectedMonthData.monthName}</span>
        </button>

        <button
          onClick={nextMonth}
          aria-label="Next Month"
          className="w-9 h-9 rounded-btn flex items-center justify-center text-coffee hover:bg-warm-beige/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-coffee/20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Month Picker Modal */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Select Month"
        subtitle="Choose month and year for expense records"
        maxWidth="sm"
      >
        {/* Year Selector */}
        <div className="flex items-center justify-between bg-warm-beige/60 p-2 rounded-btn mb-4">
          <button
            type="button"
            onClick={() => setPickerYear(prev => prev - 1)}
            className="w-8 h-8 rounded-full bg-cream text-coffee flex items-center justify-center shadow-sm hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-bold text-coffee">{pickerYear}</span>
          <button
            type="button"
            onClick={() => setPickerYear(prev => prev + 1)}
            className="w-8 h-8 rounded-full bg-cream text-coffee flex items-center justify-center shadow-sm hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {months.map(m => {
            const isSelected = pickerYear === selectedYear && m.num === selectedMonth;
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
