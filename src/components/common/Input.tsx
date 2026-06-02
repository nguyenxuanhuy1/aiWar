import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;
    
    const inputClasses = `
      font-sans bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-[14px] 
      text-[15px] text-theme-text-primary transition-all duration-300 outline-none
      placeholder:text-theme-text-muted/60 
      focus:bg-primary/5 focus:border-primary focus:ring-4 focus:ring-primary/15
      ${error ? 'border-red-500! focus:ring-red-500/15!' : ''} 
      ${className}
    `.replace(/\s+/g, ' ').trim();

    return (
      <div className="flex flex-col gap-2 w-full mb-5">
        {label && (
          <label htmlFor={inputId} className="font-sans text-sm font-medium text-theme-text-secondary transition-colors duration-150">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {error && (
          <span className="font-sans text-xs text-red-500 mt-0.5 animate-[slideDown_0.2s_ease-out]">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
