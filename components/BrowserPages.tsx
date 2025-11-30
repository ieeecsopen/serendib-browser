
import React from 'react';
import { DownloadItem, Extension } from '../types';
import { Download, File, Pause, Play, X, Shield, Search, MoreVertical, Puzzle, ToggleRight, ToggleLeft, Trash2 } from 'lucide-react';

// --- Downloads Manager Page ---
interface DownloadsPageProps {
  downloads: DownloadItem[];
  onClear: () => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ downloads, onClear }) => {
  return (
    <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
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

        <div className="space-y-3">
           {downloads.length === 0 ? (
             <div className="py-20 text-center text-zinc-600">No downloads history.</div>
           ) : (
             downloads.map(d => (
               <div key={d.id} className="group flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                     <File size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h3 className="text-sm font-medium text-zinc-200 truncate">{d.filename}</h3>
                     <a href={d.url} className="text-xs text-zinc-600 hover:underline truncate block">{d.url}</a>
                     
                     {d.state === 'progressing' && (
                        <div className="w-full max-w-sm mt-2">
                           <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(d.receivedBytes / d.totalBytes) * 100}%` }}></div>
                           </div>
                           <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
                              <span>{(d.receivedBytes / 1024 / 1024).toFixed(1)} MB / {(d.totalBytes / 1024 / 1024).toFixed(1)} MB</span>
                              <span>Downloading...</span>
                           </div>
                        </div>
                     )}
                     
                     {d.state === 'completed' && (
                        <div className="mt-1 text-[10px] text-green-500 font-medium">Completed</div>
                     )}
                     
                     {d.state === 'interrupted' && (
                        <div className="mt-1 text-[10px] text-red-500 font-medium">Interrupted</div>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white">
                        <MoreVertical size={16} />
                     </button>
                     <button className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white">
                        <X size={16} />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

// --- Extensions Manager Page ---
interface ExtensionsPageProps {
  extensions: Extension[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export const ExtensionsPage: React.FC<ExtensionsPageProps> = ({ extensions, onToggle, onRemove }) => {
  return (
    <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-zinc-900">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
            <Puzzle className="w-6 h-6" /> Extensions
          </h1>
          <button className="px-4 py-2 bg-zinc-100 text-zinc-900 text-xs font-medium rounded-md hover:bg-white transition-colors">
             Visit Web Store
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {extensions.map(ext => (
              <div key={ext.id} className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 flex flex-col justify-between h-48 hover:border-zinc-800 transition-colors">
                 <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                       <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-500">
                          {ext.icon === 'Shield' && <Shield size={20} />}
                          {ext.icon === 'PenTool' && <Puzzle size={20} />}
                          {ext.icon === 'Code' && <File size={20} />}
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-zinc-200">{ext.name}</h3>
                          <span className="text-[10px] text-zinc-500">{ext.version}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => onToggle(ext.id)}
                      className={`transition-colors ${ext.enabled ? 'text-blue-500' : 'text-zinc-600'}`}
                    >
                       {ext.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                 </div>
                 
                 <p className="text-xs text-zinc-500 line-clamp-2 mt-2">
                    {ext.description}
                 </p>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-zinc-900 mt-2">
                    <button className="text-[10px] text-zinc-400 hover:text-zinc-200">Details</button>
                    <button 
                       onClick={() => onRemove(ext.id)}
                       className="text-[10px] text-zinc-400 hover:text-red-500 flex items-center gap-1"
                    >
                       <Trash2 size={12} /> Remove
                    </button>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};
