import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center font-sans font-medium rounded-none 
    cursor-pointer transition-all duration-150 relative border border-transparent 
    gap-2 select-none whitespace-nowrap active:scale-[0.98] 
    disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: `
      bg-primary text-white 
      hover:bg-primary-hover 
    `,
    secondary: `
      bg-theme-demo-bg border border-theme-demo-border text-theme-text-primary
      hover:bg-theme-border/20 hover:border-theme-border-hover 
    `,
    danger: `
      bg-red-500 text-white 
      hover:bg-red-600 
    `,
    ghost: `
      bg-transparent text-theme-text-secondary 
      hover:bg-theme-demo-bg hover:text-theme-text-primary
    `,
  };

  const buttonClasses = `
    ${baseClasses} 
    ${sizeClasses[size]} 
    ${variantClasses[variant]} 
    ${isLoading ? 'text-transparent!' : ''} 
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <Spinner size="sm" color="white" />
        </span>
      )}
      <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
}
