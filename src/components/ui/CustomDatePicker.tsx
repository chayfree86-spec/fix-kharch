import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';

interface CustomDatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse currently selected date or default to today
  const parseDate = (dStr: string) => {
    if (!dStr || !/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
      };
    }
    const [y, m, d] = dStr.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  };

  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  useEffect(() => {
    if (isOpen) {
      const p = parseDate(value);
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [isOpen, value]);

  // Days in current viewing month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Formatted display
  const displayFormatted = () => {
    if (!value) return 'Select date';
    const [y, m, d] = value.split('-');
    const mIdx = Number(m) - 1;
    const mShort = MONTH_NAMES[mIdx] ? MONTH_NAMES[mIdx].substring(0, 3) : m;
    return `${d} ${mShort} ${y}`;
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-xs font-semibold text-coffee/80 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream hover:bg-warm-beige/40 text-coffee border border-border-warm rounded-btn text-sm font-medium transition-all shadow-warm-sm focus:outline-none focus:ring-2 focus:ring-coffee/20"
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-caramel flex-shrink-0" />
          <span className="truncate">{displayFormatted()}</span>
        </div>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Date"
        subtitle="Choose the income transaction date"
        maxWidth="sm"
      >
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between bg-warm-beige/60 p-2 rounded-btn">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-full bg-cream text-coffee flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold text-coffee">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-full bg-cream text-coffee flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map(w => (
              <span key={w} className="text-xs font-bold text-caramel py-1">
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots for month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {/* Day buttons */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                parsed.year === viewYear && parsed.month === viewMonth && parsed.day === dayNum;

              const today = new Date();
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-9 rounded-btn text-sm font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-coffee text-cream shadow-warm-sm ring-2 ring-coffee/20'
                      : isToday
                      ? 'bg-warm-beige text-coffee font-bold border border-coffee/30'
                      : 'hover:bg-warm-beige/60 text-coffee'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center justify-between pt-2 border-t border-border-warm/60">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-xs font-bold text-coffee px-3 py-1.5 rounded-btn bg-warm-beige/60 hover:bg-warm-beige transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-caramel hover:text-coffee transition-colors px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
