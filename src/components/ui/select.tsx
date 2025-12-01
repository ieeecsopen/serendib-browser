/**
 * Select Component (shadcn-style)
 * 
 * A styled select dropdown. Theme-aware.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  id,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className={`
          flex h-9 w-full items-center justify-between rounded-md 
          px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          appearance-none cursor-pointer
        `}
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-primary)',
        }}
      >
        {placeholder && !value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" 
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  );
};

export default Select;
