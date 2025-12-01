/**
 * Extensions Page Component
 * 
 * Browser extensions manager for enabling/disabling and removing extensions.
 */

import React from 'react';
import type { Extension } from '../../types';
import { Puzzle, Shield, File, ToggleRight, ToggleLeft, Trash2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ExtensionsPageProps {
  extensions: Extension[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ExtensionsPage: React.FC<ExtensionsPageProps> = ({ extensions, onToggle, onRemove }) => {
  return (
    <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-zinc-900">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
            <Puzzle className="w-6 h-6" /> Extensions
          </h1>
          <button className="px-4 py-2 bg-zinc-100 text-zinc-900 text-xs font-medium rounded-md hover:bg-white transition-colors">
            Visit Web Store
          </button>
        </header>

        {/* Extensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extensions.map(ext => (
            <ExtensionCard 
              key={ext.id} 
              extension={ext} 
              onToggle={onToggle} 
              onRemove={onRemove} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

interface ExtensionCardProps {
  extension: Extension;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({ extension, onToggle, onRemove }) => {
  const getIcon = () => {
    switch (extension.icon) {
      case 'Shield':
        return <Shield size={20} />;
      case 'PenTool':
        return <Puzzle size={20} />;
      case 'Code':
        return <File size={20} />;
      default:
        return <Puzzle size={20} />;
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 flex flex-col justify-between h-48 hover:border-zinc-800 transition-colors">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-500">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-200">{extension.name}</h3>
            <span className="text-[10px] text-zinc-500">{extension.version}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle(extension.id)}
          className={`transition-colors ${extension.enabled ? 'text-blue-500' : 'text-zinc-600'}`}
        >
          {extension.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 line-clamp-2 mt-2">
        {extension.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-900 mt-2">
        <button className="text-[10px] text-zinc-400 hover:text-zinc-200">Details</button>
        <button
          onClick={() => onRemove(extension.id)}
          className="text-[10px] text-zinc-400 hover:text-red-500 flex items-center gap-1"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
};

export default ExtensionsPage;
