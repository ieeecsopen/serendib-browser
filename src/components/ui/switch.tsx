/**
 * Switch Component (shadcn-style)
 * 
 * A toggle switch for boolean settings.
 */

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  className = '',
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`
        peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full 
        border-2 border-transparent shadow-sm transition-colors 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-white' : 'bg-zinc-800'}
        ${className}
      `}
    >
      <span
        className={`
          pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform
          ${checked ? 'translate-x-4 bg-zinc-950' : 'translate-x-0 bg-zinc-400'}
        `}
      />
    </button>
  );
};

export default Switch;
