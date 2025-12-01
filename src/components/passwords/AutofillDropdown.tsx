/**
 * Autofill Dropdown Component
 * 
 * Shows available credentials when a login form is detected.
 * Positioned near the focused input field.
 */

import React, { useEffect, useRef } from 'react';
import type { AutofillSuggestion } from '../../types/passwords';
import { User, Key, Plus, Settings } from 'lucide-react';

interface AutofillDropdownProps {
  isVisible: boolean;
  suggestions: AutofillSuggestion[];
  position: { x: number; y: number };
  onSelect: (suggestion: AutofillSuggestion) => void;
  onOpenManager: () => void;
  onDismiss: () => void;
}

export const AutofillDropdown: React.FC<AutofillDropdownProps> = ({
  isVisible,
  suggestions,
  position,
  onSelect,
  onOpenManager,
  onDismiss,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onDismiss]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Key size={12} />
          <span>Serendib Passwords</span>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div className="py-1 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.credentialId}
              onClick={() => onSelect(suggestion)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left group"
            >
              {/* Avatar/Favicon */}
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                {suggestion.favicon ? (
                  <img src={suggestion.favicon} alt="" className="w-5 h-5 rounded" />
                ) : (
                  <User size={14} className="text-zinc-500" />
                )}
              </div>

              {/* Credential info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{suggestion.username}</p>
                <p className="text-xs text-zinc-500 truncate">{suggestion.domain}</p>
              </div>

              {/* Indicator */}
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-zinc-500">No saved passwords</p>
          <p className="text-xs text-zinc-600 mt-1">for this website</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="border-t border-zinc-800 p-1">
        <button
          onClick={onOpenManager}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Settings size={12} />
          <span>Manage Passwords</span>
        </button>
      </div>
    </div>
  );
};

export default AutofillDropdown;
