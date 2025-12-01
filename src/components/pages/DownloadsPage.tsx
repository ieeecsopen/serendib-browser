/**
 * Downloads Page Component
 * 
 * Displays download history with progress tracking and management.
 */

import React from 'react';
import type { DownloadItem } from '../../types';
import { Download, File, X, Search, MoreVertical } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface DownloadsPageProps {
  downloads: DownloadItem[];
  onClear: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ downloads, onClear }) => {
  return (
    <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-zinc-900">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
            <Download className="w-6 h-6" /> Downloads
          </h1>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Search downloads"
                className="bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-4 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <button
              onClick={onClear}
              className="px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors border border-zinc-900 hover:border-zinc-800"
            >
              Clear All
            </button>
          </div>
        </header>

        {/* Downloads List */}
        <div className="space-y-3">
          {downloads.length === 0 ? (
            <EmptyState />
          ) : (
            downloads.map(d => <DownloadItemCard key={d.id} download={d} />)
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

const EmptyState: React.FC = () => (
  <div className="py-20 text-center text-zinc-600">No downloads history.</div>
);

interface DownloadItemCardProps {
  download: DownloadItem;
}

const DownloadItemCard: React.FC<DownloadItemCardProps> = ({ download }) => {
  const progress = (download.receivedBytes / download.totalBytes) * 100;
  
  return (
    <div className="group flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
      
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
        <File size={20} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-zinc-200 truncate">{download.filename}</h3>
        <a href={download.url} className="text-xs text-zinc-600 hover:underline truncate block">
          {download.url}
        </a>

        {/* Progress Bar */}
        {download.state === 'progressing' && (
          <div className="w-full max-w-sm mt-2">
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
              <span>
                {(download.receivedBytes / 1024 / 1024).toFixed(1)} MB /{' '}
                {(download.totalBytes / 1024 / 1024).toFixed(1)} MB
              </span>
              <span>Downloading...</span>
            </div>
          </div>
        )}

        {/* Status */}
        {download.state === 'completed' && (
          <div className="mt-1 text-[10px] text-green-500 font-medium">Completed</div>
        )}
        {download.state === 'interrupted' && (
          <div className="mt-1 text-[10px] text-red-500 font-medium">Interrupted</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white">
          <MoreVertical size={16} />
        </button>
        <button className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default DownloadsPage;
