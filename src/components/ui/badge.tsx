/**
 * Badge Component (shadcn-style)
 * 
 * A badge for status indicators.
 */

import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const variants = {
    default: 'bg-zinc-50 text-zinc-900 hover:bg-zinc-50/80',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-800/80',
    destructive: 'bg-red-900/50 text-red-200 hover:bg-red-900/40',
    outline: 'border border-zinc-700 text-zinc-200',
    success: 'bg-green-900/50 text-green-200 hover:bg-green-900/40',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold 
        transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
