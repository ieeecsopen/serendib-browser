/**
 * Label Component (shadcn-style)
 * 
 * A label for form elements. Theme-aware.
 */

import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', style, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      style={{ color: 'var(--text-primary)', ...style }}
      {...props}
    />
  )
);

Label.displayName = 'Label';

export default Label;
