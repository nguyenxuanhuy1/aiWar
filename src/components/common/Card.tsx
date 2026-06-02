import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animate?: boolean;
}

export function Card({ children, animate = true, className = '', ...props }: CardProps) {
  const cardClassName = `
    bg-theme-card backdrop-blur-md border border-theme-border shadow-2xl rounded-2xl p-8 
    transition-all duration-300 relative overflow-hidden
    before:content-[''] before:absolute before:-top-1/2 before:-left-1/2 before:w-[200%] before:h-[200%] 
    before:bg-[radial-gradient(circle,var(--primary-glow)_0%,transparent_75%)] before:pointer-events-none 
    before:opacity-50 before:transition-opacity
    hover:border-theme-border-hover 
    hover:shadow-[0_12px_40px_rgba(15,23,42,0.08),0_0_24px_var(--primary-glow)]
    dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_24px_var(--primary-glow)]
    ${animate ? 'animate-fade-in' : ''} 
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={cardClassName} {...props}>
      {children}
    </div>
  );
}
