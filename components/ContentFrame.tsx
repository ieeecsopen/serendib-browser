import React, { useState, useEffect, useRef } from 'react';
import { Tab, Bookmark, HistoryItem, BrowserSettings, OfflinePage, DownloadItem, Extension } from '../types';
import { MOCK_SEARCH_RESULTS } from '../constants';
import { ShieldAlert, Search, Link as LinkIcon, Settings, Clock, Star, Trash2, Check, ExternalLink, Cloud, Calendar, DollarSign, Newspaper, Bus, LayoutGrid, X, TrendingUp, Sun, Moon, Globe, Zap, Database, Cpu, Palette, Layout, Shield, ArrowRight, Plus, DownloadCloud, FileText, Wifi, WifiOff, RefreshCcw, Bell, Home, PlusSquare, Sliders, MessageCircle, Github, Twitter, Instagram, Disc, Dribbble, Hexagon } from 'lucide-react';
import { FindBar } from './BrowserUI';
import { DownloadsPage, ExtensionsPage } from './BrowserPages';

interface ContentFrameProps {
  activeTab: Tab | undefined;
  bookmarks: Bookmark[];
  history: HistoryItem[];
  offlinePages: OfflinePage[];
  downloads: DownloadItem[];
  extensions: Extension[];
  settings: BrowserSettings;
  showFindBar: boolean;
  onCloseFindBar: () => void;
  onNavigate: (url: string) => void;
  onDeleteBookmark: (id: string) => void;
  onClearHistory: () => void;
  onUpdateSetting: (key: keyof BrowserSettings, value: any) => void;
  onDeleteOfflinePage: (id: string) => void;
  onSyncOfflinePages: () => void;
  onClearDownloads: () => void;
  onToggleExtension: (id: string) => void;
  onRemoveExtension: (id: string) => void;
}

export const ContentFrame: React.FC<ContentFrameProps> = ({
  activeTab,
  bookmarks,
  history,
  offlinePages,
  downloads,
  extensions,
  settings,
  showFindBar,
  onCloseFindBar,
  onNavigate,
  onDeleteBookmark,
  onClearHistory,
  onUpdateSetting,
  onDeleteOfflinePage,
  onSyncOfflinePages,
  onClearDownloads,
  onToggleExtension,
  onRemoveExtension
}) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Cosmos Atmosphere Animation ---
  useEffect(() => {
    if (activeTab?.url !== 'serendib://newtab') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    // Cosmos Palette: Warm Oranges, Browns, Deep Blacks
    const blobs = [
      { x: width * 0.2, y: height * 0.4, r: 600, color: 'rgba(124, 45, 18, 0.15)', vx: 0.2, vy: 0.1 }, // Rust/Brown
      { x: width * 0.8, y: height * 0.3, r: 500, color: 'rgba(234, 88, 12, 0.12)', vx: -0.3, vy: 0.2 }, // Orange
      { x: width * 0.5, y: height * -0.1, r: 800, color: 'rgba(67, 20, 7, 0.3)', vx: 0.1, vy: 0.1 }, // Dark Red/Brown
      { x: width * 0.9, y: height * 0.9, r: 400, color: 'rgba(20, 20, 20, 0.8)', vx: -0.2, vy: -0.2 }, // Shadow
    ];

    let animationFrameId: number;

    const animate = () => {
      // Deep Space Black Background
      ctx.fillStyle = '#050505'; 
      ctx.fillRect(0, 0, width, height);
      
      // Update blob positions
      blobs.forEach(blob => {
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Soft Bounce
        if (blob.x < -200 || blob.x > width + 200) blob.vx *= -1;
        if (blob.y < -200 || blob.y > height + 200) blob.vy *= -1;
      });

      // Draw Blobs
      blobs.forEach(blob => {
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'rgba(5, 5, 5, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Add subtle noise/stars? 
      // Keeping it clean for now to match the soft gradient look.

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
        if(canvas) {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
    };
  }, [activeTab?.url]);

  const Switch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-700 ${
        checked ? 'bg-white' : 'bg-zinc-800'
      }`}
    >
      <span
        className={`${
          checked ? 'translate-x-4' : 'translate-x-1'
        } inline-block h-3.5 w-3.5 transform rounded-full transition-transform duration-200 ease-in-out ${checked ? 'bg-black' : 'bg-zinc-400'}`}
      />
    </button>
  );

  if (!activeTab) return <div className="flex-1 bg-black" />;

  const url = activeTab.url;

  // --- 1. Downloads Manager ---
  if (url === 'serendib://downloads') {
    return <DownloadsPage downloads={downloads} onClear={onClearDownloads} />;
  }

  // --- 2. Extensions Manager ---
  if (url === 'serendib://extensions') {
    return <ExtensionsPage extensions={extensions} onToggle={onToggleExtension} onRemove={onRemoveExtension} />;
  }

  // --- 3. New Tab Page (Cosmos Redesign) ---
  if (url === 'serendib://newtab') {
    return (
      <div className="flex-1 bg-[#050505] relative overflow-hidden flex flex-col font-sans text-white select-none">
        {/* Cosmos Background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/10 to-[#050505] pointer-events-none" />
        
        {/* Main Layout Grid */}
        <div className="relative z-10 flex-1 flex">
            
            {/* Left Social Sidebar (Visual Only as per design) */}
            <div className="hidden lg:flex w-16 flex-col items-center py-8 gap-8 border-r border-white/5 bg-white/[0.01] backdrop-blur-[1px]">
               <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Hexagon size={20} /></button>
               <div className="w-8 h-px bg-white/5" />
               <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Twitter size={18} /></button>
               <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Instagram size={18} /></button>
               <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Disc size={18} /></button>
               <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Dribbble size={18} /></button>
            </div>

            {/* Center Content */}
            <div className="flex-1 flex flex-col relative overflow-y-auto">
                
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
                    <div className="text-xl font-bold tracking-tight text-white/90 font-display">cosmos</div>
                    
                    <div className="flex items-center gap-6 text-zinc-400">
                        <button className="hover:text-white transition-colors"><Home size={20} strokeWidth={1.5} /></button>
                        <button className="hover:text-white transition-colors"><Search size={20} strokeWidth={1.5} /></button>
                        <button className="hover:text-white transition-colors"><Bell size={20} strokeWidth={1.5} /></button>
                        <button className="hover:text-white transition-colors"><PlusSquare size={20} strokeWidth={1.5} /></button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-zinc-400 hover:text-white transition-colors"><Sliders size={18} strokeWidth={1.5} /></button>
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col items-center pt-8 pb-12 px-8 w-full max-w-7xl mx-auto">
                    
                    {/* Search Section */}
                    <div className="w-full max-w-2xl relative mb-16 group z-20">
                        <input 
                           type="text" 
                           placeholder="Search" 
                           className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-6 pr-12 text-lg text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/[0.07] focus:border-white/20 transition-all shadow-2xl shadow-black/50"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               onNavigate(e.currentTarget.value);
                             }
                           }}
                           autoFocus
                        />
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-500 group-hover:text-white transition-colors">
                            <Search size={20} />
                        </button>
                    </div>

                    {/* Dashboard Cards Grid */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                        
                        {/* Card 1: Nebula */}
                        <div 
                           onClick={() => onNavigate('https://nasa.gov')}
                           className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-orange-950 to-black opacity-80 group-hover:opacity-100 transition-opacity" />
                            {/* Gradient Simulation of Image */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/30 via-transparent to-transparent" />
                            
                            <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                <h3 className="text-sm font-bold text-white leading-tight mb-1 group-hover:underline decoration-white/30 underline-offset-4">Hubble Spies Newly Forming Star Incubating</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold">N</div>
                                    <span className="text-[10px] text-zinc-400 font-medium">NASA</span>
                                    <Check size={8} className="text-blue-500 bg-white rounded-full p-[1px]" />
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Nature/Dog */}
                        <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black opacity-80 group-hover:opacity-100 transition-opacity" />
                             {/* Gradient Simulation of Image */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/40 via-transparent to-transparent" />

                            <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                <h3 className="text-sm font-bold text-white leading-tight mb-1">New Research about Habitual patterns of Pets released</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[8px] font-bold">N</div>
                                    <span className="text-[10px] text-zinc-400 font-medium">NASA</span>
                                    <Check size={8} className="text-blue-500 bg-white rounded-full p-[1px]" />
                                </div>
                            </div>
                        </div>

                         {/* Card 3: Water/Nature */}
                        <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-slate-900 to-black opacity-80 group-hover:opacity-100 transition-opacity" />
                             {/* Gradient Simulation of Image */}
                             <div className="absolute inset-0 bg-[linear-gradient(45deg,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

                            <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                <h3 className="text-sm font-bold text-white leading-tight mb-1">Boxed Water is Better. A new Business made around water boxes</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[8px] font-bold">B</div>
                                    <span className="text-[10px] text-zinc-400 font-medium">Boxed Water</span>
                                    <Check size={8} className="text-blue-500 bg-white rounded-full p-[1px]" />
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Tech/Telescope */}
                        <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black opacity-80 group-hover:opacity-100 transition-opacity" />
                            {/* Gradient Simulation of Image */}
                            <div className="absolute inset-0 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-zinc-700/30 via-transparent to-transparent" />

                            <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                <h3 className="text-sm font-bold text-white leading-tight mb-1">New Unistellar with Fully Automatic Focusing and Light pollution Reduction</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold">U</div>
                                    <span className="text-[10px] text-zinc-400 font-medium">Unistellar Optics</span>
                                    <Check size={8} className="text-blue-500 bg-white rounded-full p-[1px]" />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row (Hidden/Overflow simulation) */}
                        <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 opacity-50 hover:opacity-100">
                             <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-950 to-black" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <Plus className="text-white/20 group-hover:text-white/80 transition-colors" size={48} />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- 4. Offline Reading List ---
  if (url === 'serendib://offline') {
    const handleSync = () => {
      setIsSyncing(true);
      onSyncOfflinePages();
      setTimeout(() => setIsSyncing(false), 2000); // Simulate network delay
    };

    return (
      <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
           <header className="flex items-center justify-between pb-6 border-b border-zinc-900">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
              <DownloadCloud className="w-6 h-6" /> Reading List
            </h1>
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleSync}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md transition-colors"
               >
                 <RefreshCcw size={12} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? 'Syncing...' : 'Sync Now'}
               </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offlinePages.length === 0 ? (
               <div className="col-span-full py-20 text-center text-zinc-600">
                  <WifiOff size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No offline pages saved.</p>
                  <p className="text-xs mt-2">Click the download icon in the address bar to save pages.</p>
               </div>
            ) : (
               offlinePages.map(page => (
                  <div key={page.id} className="group relative bg-zinc-950 border border-zinc-900 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between h-48">
                      <div>
                         <h3 
                            className="text-lg font-medium text-zinc-200 hover:text-white mb-2 line-clamp-2 cursor-pointer"
                            onClick={() => onNavigate(`serendib://read/${page.id}`)}
                         >
                            {page.title}
                         </h3>
                         <p className="text-sm text-zinc-500 line-clamp-3">{page.excerpt}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 border-t border-zinc-900 pt-3">
                         <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                            <span>{new Date(page.savedAt).toLocaleDateString()}</span>
                            <span>{page.size}</span>
                            <span className={page.synced ? "text-green-500" : "text-amber-500"}>
                               {page.synced ? "Synced" : "Local Only"}
                            </span>
                         </div>
                         <button 
                           onClick={() => onDeleteOfflinePage(page.id)}
                           className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                  </div>
               ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 5. Offline Reader View ---
  if (url.startsWith('serendib://read/')) {
     const pageId = url.split('/').pop();
     const page = offlinePages.find(p => p.id === pageId);

     if (!page) {
        return (
           <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>Page not found or deleted.</p>
              <button onClick={() => onNavigate('serendib://offline')} className="mt-4 text-blue-500 hover:underline">Return to Reading List</button>
           </div>
        );
     }

     return (
        <div className="flex-1 bg-[#111] text-zinc-300 p-8 md:p-12 overflow-y-auto font-serif leading-relaxed relative">
           <FindBar isOpen={showFindBar} onClose={onCloseFindBar} />
           
           <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <button onClick={() => onNavigate('serendib://offline')} className="mb-8 flex items-center gap-2 text-xs font-sans text-zinc-500 hover:text-zinc-300 transition-colors">
                  <ArrowRight size={12} className="rotate-180" /> Back to list
               </button>
               
               {/* Content Injection */}
               <div dangerouslySetInnerHTML={{ __html: page.content }} />

               <div className="mt-16 pt-8 border-t border-zinc-900 text-center">
                  <p className="text-xs font-sans text-zinc-600">End of saved content</p>
               </div>
           </div>
        </div>
     );
  }

  // --- 6. History Page ---
  if (url === 'serendib://history') {
    return (
      <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center justify-between pb-6 border-b border-zinc-900">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
              History
            </h1>
            <button 
              onClick={onClearHistory}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors"
            >
              Clear Data
            </button>
          </header>
          
          <div className="space-y-1">
            {history.length === 0 ? (
              <div className="py-20 text-center text-zinc-600">
                <p>No history.</p>
              </div>
            ) : (
              history.slice().reverse().map((item) => (
                <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="text-zinc-600">
                      <Clock size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <button onClick={() => onNavigate(item.url)} className="text-left text-sm font-medium text-zinc-300 hover:text-white truncate">
                        {item.title}
                      </button>
                      <span className="text-xs text-zinc-600 truncate">{new URL(item.url).hostname}</span>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-white transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 7. Settings Page ---
  if (url === 'serendib://settings') {
    return (
      <div className="flex-1 bg-black p-6 md:p-12 overflow-y-auto font-sans">
        <div className="max-w-3xl mx-auto">
          <header className="mb-10 border-b border-zinc-900 pb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-white flex items-center gap-3">
              Settings
            </h1>
          </header>

          <div className="space-y-12">
            
            {/* General Section */}
            <section className="space-y-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">General</h2>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Language</p>
                    </div>
                    <select 
                      value={settings.language}
                      onChange={(e) => onUpdateSetting('language', e.target.value)}
                      className="h-8 px-2 rounded bg-zinc-900 text-zinc-300 text-xs border border-zinc-800 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="si-LK">Sinhala (LK)</option>
                      <option value="ta-LK">Tamil (LK)</option>
                    </select>
                 </div>

                 <div className="flex items-center justify-between">
                    <div>
                         <p className="font-medium text-zinc-200">Vertical Tabs</p>
                    </div>
                    <Switch checked={settings.verticalTabs} onChange={(v) => onUpdateSetting('verticalTabs', v)} />
                 </div>

                 <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Search Engine</p>
                    </div>
                    <select 
                      value={settings.searchEngine}
                      onChange={(e) => onUpdateSetting('searchEngine', e.target.value)}
                      className="h-8 px-2 rounded bg-zinc-900 text-zinc-300 text-xs border border-zinc-800 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="Google">Google</option>
                      <option value="Bing">Bing</option>
                      <option value="DuckDuckGo">DuckDuckGo</option>
                    </select>
                 </div>
              </div>
            </section>

             {/* Privacy Section */}
             <section className="space-y-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Privacy & Security</h2>
               <div className="space-y-6">
                 
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Ad Blocker</p>
                    </div>
                    <Switch checked={settings.enableAdBlock} onChange={(v) => onUpdateSetting('enableAdBlock', v)} />
                 </div>

                 <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Data Saver Mode</p>
                    </div>
                    <Switch checked={settings.dataSaver} onChange={(v) => onUpdateSetting('dataSaver', v)} />
                 </div>
               </div>
            </section>

            {/* Performance Section */}
             <section className="space-y-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Performance</h2>
               <div className="space-y-6">
                 
                 <div className="flex items-center justify-between">
                     <div>
                       <p className="font-medium text-zinc-200">Memory Saver</p>
                     </div>
                    <Switch checked={settings.memorySaver} onChange={(v) => onUpdateSetting('memorySaver', v)} />
                 </div>

                 <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Low-spec Mode</p>
                    </div>
                    <Switch checked={settings.lowSpecMode} onChange={(v) => onUpdateSetting('lowSpecMode', v)} />
                 </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // --- 8. Search Results Page (Minimalist) ---
  const isSearch = !url.includes('.') || url.includes('search');
  
  if (isSearch) {
    const query = url.includes('search') ? new URLSearchParams(url.split('?')[1]).get('q') : url;
    return (
      <div className="flex-1 bg-black p-8 overflow-y-auto font-sans relative">
         <FindBar isOpen={showFindBar} onClose={onCloseFindBar} />
         
         <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center space-x-4 border-b border-zinc-900 pb-4">
               <div className="relative w-full">
                 <input 
                  value={query || ''} 
                  readOnly 
                  className="w-full pl-0 pr-4 py-2 bg-transparent text-xl font-light text-white focus:outline-none"
                />
               </div>
            </div>
            
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Search Results</p>

            {MOCK_SEARCH_RESULTS.map((res, i) => (
              <div key={i} className="group">
                <div className="flex items-center space-x-2 text-xs text-zinc-500 mb-1">
                   <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500 border border-zinc-800">
                     {new URL(res.url).hostname.charAt(0).toUpperCase()}
                   </div>
                   <span className="font-medium text-zinc-500">{new URL(res.url).hostname}</span>
                </div>
                <a href="#" className="text-lg text-white hover:text-zinc-300 font-medium block mb-1 transition-colors">
                  {res.title}
                </a>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl line-clamp-2">
                  {res.snippet}
                </p>
              </div>
            ))}
            
            <div className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-lg mt-12 flex items-start gap-3">
              <ShieldAlert className="text-zinc-500 shrink-0 w-4 h-4 mt-0.5" />
              <div>
                <h3 className="font-medium text-zinc-300 text-xs">Simulation Mode</h3>
                <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
                  External browsing is restricted in this demo environment.
                </p>
              </div>
            </div>
         </div>
      </div>
    );
  }

  // --- 9. External URL Fallback ---
  return (
    <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 text-center font-sans relative">
       <FindBar isOpen={showFindBar} onClose={onCloseFindBar} />
       
       <div className="max-w-md w-full space-y-6">
          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white mb-2">Content Blocked</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
               Unable to display <span className="text-zinc-300">{url}</span>.<br/>
               External sites cannot be embedded in this preview.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <a 
              href={url.startsWith('http') ? url : `https://${url}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-white text-black py-2.5 rounded-md hover:bg-zinc-200 transition-all font-medium text-xs"
            >
              Open in New Tab <ExternalLink size={12} />
            </a>
            <button 
              onClick={() => onNavigate('serendib://newtab')}
              className="w-full bg-zinc-900 text-zinc-400 py-2.5 rounded-md hover:bg-zinc-800 transition-colors text-xs font-medium"
            >
              Back to Home
            </button>
          </div>
       </div>
    </div>
  );
};