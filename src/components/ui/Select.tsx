import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold tracking-wider text-theme-text-secondary uppercase select-none">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-none bg-gray-950 border text-sm
              text-theme-text-primary focus:outline-none transition-all duration-200
              appearance-none cursor-pointer
              ${
                error
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-theme-input-border focus:border-primary/50'
              }
              ${className}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-950 text-gray-200">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-theme-text-muted text-xs select-none">
            ▼
          </div>
        </div>
        {error && (
          <span className="text-[11px] text-red-500 font-medium mt-0.5 animate-pulse">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
