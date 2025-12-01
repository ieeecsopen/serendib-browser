/**
 * Separator Component (shadcn-style)
 * 
 * A visual separator for content.
 */

import React from 'react';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  className = '',
}) => (
  <div
    className={`
      shrink-0 bg-zinc-800
      ${orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'}
      ${className}
    `}
  />
);

export default Separator;
