import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option<T = string> {
  value: T;
  label: string;
  icon?: React.ElementType;
  description?: string;
}

interface CustomSelectProps<T = string> {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option',
  className = '',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-coffee/80 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream hover:bg-warm-beige/40 text-coffee border border-border-warm rounded-btn text-sm font-medium transition-all shadow-warm-sm focus:outline-none focus:ring-2 focus:ring-coffee/20"
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-caramel flex-shrink-0" />
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-caramel transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-cream border border-border-warm rounded-card shadow-warm-lg py-1 max-h-60 overflow-y-auto animate-fade-in">
          {options.map(opt => {
            const isSelected = opt.value === value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-warm-beige/80 text-coffee font-semibold'
                    : 'text-coffee/80 hover:bg-warm-beige/40 hover:text-coffee'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {Icon && <Icon className={`w-4 h-4 ${isSelected ? 'text-coffee' : 'text-caramel'}`} />}
                  <div>
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[11px] text-caramel truncate">{opt.description}</div>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-coffee flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
