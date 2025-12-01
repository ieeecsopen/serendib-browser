/**
 * Find Bar Component
 * 
 * In-page search bar for finding text on the current page.
 */

import React from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface FindBarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const FindBar: React.FC<FindBarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-8 w-80 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl z-40 animate-in slide-in-from-top-2 duration-200 flex items-center p-2 gap-2">
      <input
        type="text"
        placeholder="Find in page..."
        autoFocus
        className="flex-1 bg-zinc-900 border-none rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600"
      />
      <span className="text-xs text-zinc-600 font-mono">0/0</span>
      <div className="h-4 w-px bg-zinc-800" />
      <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
        <ChevronUp size={16} />
      </button>
      <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
        <ChevronDown size={16} />
      </button>
      <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white ml-1">
        <X size={16} />
      </button>
    </div>
  );
};

export default FindBar;
