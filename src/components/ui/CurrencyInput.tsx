import React, { forwardRef } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  className = '',
  id,
  placeholder = '0',
  ...props
}, ref) => {
  const inputId = id || `curr-input-${Math.random().toString(36).substr(2, 6)}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Strip non-digit characters except decimals
    const clean = rawVal.replace(/[^0-9]/g, '');
    const num = clean === '' ? 0 : parseInt(clean, 10);
    onChange(num);
  };

  const displayValue = value === 0 || value === '0' || value === '' ? '' : value.toString();

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-coffee flex items-center justify-between">
          <span>{label} {required && <span className="text-expense-red">*</span>}</span>
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-base font-semibold text-caramel select-none pointer-events-none">
          ₹
        </span>
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full h-12 pl-8 pr-4 bg-cream border rounded-btn text-base font-semibold text-coffee-dark placeholder:text-coffee/35 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-coffee/20 focus:border-coffee transition-all duration-150 shadow-sm ${
            error ? 'border-expense-red focus:border-expense-red focus:ring-expense-red/20' : 'border-border-warm'
          } ${className}`}
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-expense-red animate-fade-in">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-caramel">{helperText}</p>
      )}
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';
