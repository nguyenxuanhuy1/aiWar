import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    white: 'border-t-white!',
    primary: 'border-t-primary!',
  };

  return (
    <div 
      className={`border-white/10 rounded-full animate-spin inline-block ${sizeClasses[size]} ${colorClasses[color]}`} 
      role="status"
    />
  );
}
