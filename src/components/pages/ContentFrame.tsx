/**
 * Content Frame Component
 * 
 * Main content area that renders either internal pages or WebViews
 * for external URLs.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Tab, Bookmark, HistoryItem, BrowserSettings, OfflinePage, DownloadItem, Extension, Container, SitePermissions, DefaultPermissions, PermissionType, PermissionSetting } from '../../types';
import { MOCK_SEARCH_RESULTS } from '../../constants';
import { FindBar } from '../ui/FindBar';
import { DownloadsPage } from './DownloadsPage';
import { ExtensionsPage } from './ExtensionsPage';
import { SettingsPage } from './SettingsPage';
import { PasswordManagerPage } from './PasswordManagerPage';
import { WebView } from '../browser/WebView';
import { 
  ShieldAlert, Clock, Trash2, Check, ArrowRight, Plus, DownloadCloud, 
  FileText, WifiOff, RefreshCcw, Bell, Home, Search, PlusSquare, 
  Sliders, Twitter, Instagram, Disc, Dribbble, Hexagon, BookOpen,
  Tag, Calendar, User, ExternalLink, FolderOpen, HardDrive
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ContentFrameProps {
  activeTab: Tab | undefined;
  tabs: Tab[];
  containers: Container[];
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
  onTabTitleChange: (tabId: string, title: string) => void;
  onTabUrlChange: (tabId: string, url: string) => void;
  onTabLoadingChange: (tabId: string, isLoading: boolean) => void;
  onTabFaviconChange: (tabId: string, favicon: string) => void;
  onPasswordFormDetected?: (url: string, hasCredentials: boolean) => void;
  onCredentialSubmitted?: (url: string, username: string, password: string) => void;
  onTabZoomChange?: (tabId: string, zoomFactor: number) => void;
  // Permissions
  sitePermissionsMap?: Record<string, SitePermissions>;
  defaultPermissions?: DefaultPermissions;
  onUpdateDefaultPermission?: (permission: PermissionType, setting: PermissionSetting) => void;
  onResetSitePermissions?: (origin: string) => void;
  onClearAllSitePermissions?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ContentFrame: React.FC<ContentFrameProps> = ({
  activeTab,
  tabs,
  containers,
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
  onRemoveExtension,
  onTabTitleChange,
  onTabUrlChange,
  onTabLoadingChange,
  onTabFaviconChange,
  onPasswordFormDetected,
  onCredentialSubmitted,
  onTabZoomChange,
  // Permissions
  sitePermissionsMap,
  defaultPermissions,
  onUpdateDefaultPermission,
  onResetSitePermissions,
  onClearAllSitePermissions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cosmos background animation for new tab
  useEffect(() => {
    if (activeTab?.url !== 'serendib://newtab') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const blobs = [
      { x: width * 0.2, y: height * 0.4, r: 600, color: 'rgba(124, 45, 18, 0.15)', vx: 0.2, vy: 0.1 },
      { x: width * 0.8, y: height * 0.3, r: 500, color: 'rgba(234, 88, 12, 0.12)', vx: -0.3, vy: 0.2 },
      { x: width * 0.5, y: height * -0.1, r: 800, color: 'rgba(67, 20, 7, 0.3)', vx: 0.1, vy: 0.1 },
      { x: width * 0.9, y: height * 0.9, r: 400, color: 'rgba(20, 20, 20, 0.8)', vx: -0.2, vy: -0.2 },
    ];

    let animationFrameId: number;

    const animate = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      
      blobs.forEach(blob => {
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < -200 || blob.x > width + 200) blob.vx *= -1;
        if (blob.y < -200 || blob.y > height + 200) blob.vy *= -1;
      });

      blobs.forEach(blob => {
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'rgba(5, 5, 5, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (canvas) {
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

  if (!activeTab) return <div className="flex-1 bg-black" />;

  const url = activeTab.url;

  // Downloads Page
  if (url === 'serendib://downloads') {
    return <DownloadsPage downloads={downloads} onClear={onClearDownloads} />;
  }

  // Extensions Page
  if (url === 'serendib://extensions') {
    return <ExtensionsPage extensions={extensions} onToggle={onToggleExtension} onRemove={onRemoveExtension} />;
  }

  // Password Manager Page
  if (url === 'serendib://passwords') {
    return <PasswordManagerPage onNavigate={onNavigate} />;
  }

  // New Tab Page
  if (url === 'serendib://newtab') {
    return (
      <NewTabPage 
        canvasRef={canvasRef} 
        onNavigate={onNavigate} 
      />
    );
  }

  // Offline Reading List
  if (url === 'serendib://offline') {
    return (
      <OfflineListPage
        offlinePages={offlinePages}
        isSyncing={isSyncing}
        onSync={() => {
          setIsSyncing(true);
          onSyncOfflinePages();
          setTimeout(() => setIsSyncing(false), 2000);
        }}
        onDelete={onDeleteOfflinePage}
        onNavigate={onNavigate}
      />
    );
  }

  // Offline Reader View
  if (url.startsWith('serendib://read/')) {
    const pageId = url.split('/').pop();
    const page = offlinePages.find(p => p.id === pageId);
    return (
      <OfflineReaderPage
        page={page}
        showFindBar={showFindBar}
        onCloseFindBar={onCloseFindBar}
        onNavigate={onNavigate}
      />
    );
  }

  // History Page
  if (url === 'serendib://history') {
    return (
      <HistoryPage
        history={history}
        onClear={onClearHistory}
        onNavigate={onNavigate}
      />
    );
  }

  // Settings Page
  if (url === 'serendib://settings') {
    return (
      <SettingsPage
        settings={settings}
        onUpdateSetting={onUpdateSetting}
        onOpenPasswordManager={() => onNavigate('serendib://passwords')}
        sitePermissionsMap={sitePermissionsMap}
        defaultPermissions={defaultPermissions}
        onUpdateDefaultPermission={onUpdateDefaultPermission}
        onResetSitePermissions={onResetSitePermissions}
        onClearAllSitePermissions={onClearAllSitePermissions}
      />
    );
  }

  // Search Results (mock)
  const isSearch = url.startsWith('https://search') || url.startsWith('http://search');
  if (isSearch) {
    const query = new URLSearchParams(url.split('?')[1]).get('q');
    return (
      <SearchResultsPage
        query={query}
        showFindBar={showFindBar}
        onCloseFindBar={onCloseFindBar}
      />
    );
  }

  // External URL - Render WebViews
  const isElectron = typeof window !== 'undefined' && (window as any).electron;
  
  if (isElectron) {
    return (
      <div className="flex-1 bg-black relative overflow-hidden">
        <FindBar isOpen={showFindBar} onClose={onCloseFindBar} />
        {tabs.filter(tab => !tab.url.startsWith('serendib://')).map(tab => {
          const container = containers.find(c => c.id === tab.containerId);
          return (
            <WebView
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTab?.id}
              container={container}
              onTitleChange={onTabTitleChange}
              onUrlChange={onTabUrlChange}
              onLoadingChange={onTabLoadingChange}
              onFaviconChange={onTabFaviconChange}
              onNavigate={onNavigate}
              onPasswordFormDetected={onPasswordFormDetected}
              onCredentialSubmitted={onCredentialSubmitted}
              onZoomChange={onTabZoomChange}
            />
          );
        })}
      </div>
    );
  }

  // Web fallback (non-Electron)
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
            Unable to display <span className="text-zinc-300">{url}</span>.<br />
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
            Open in New Tab
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

// ============================================================================
// Sub-Pages
// ============================================================================

const NewTabPage: React.FC<{
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onNavigate: (url: string) => void;
}> = ({ canvasRef, onNavigate }) => (
  <div className="flex-1 bg-[#050505] relative overflow-hidden flex flex-col font-sans text-white select-none">
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/10 to-[#050505] pointer-events-none" />
    
    <div className="relative z-10 flex-1 flex">
      {/* Social Sidebar */}
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
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center pt-8 pb-12 px-8 w-full max-w-7xl mx-auto">
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

          {/* Dashboard Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            <DashboardCard
              onClick={() => onNavigate('https://nasa.gov')}
              gradient="from-orange-900 via-orange-950 to-black"
              title="Hubble Spies Newly Forming Star Incubating"
              source="NASA"
            />
            <DashboardCard
              gradient="from-stone-800 via-stone-900 to-black"
              title="New Research about Habitual patterns of Pets released"
              source="NASA"
            />
            <DashboardCard
              gradient="from-sky-900 via-slate-900 to-black"
              title="Boxed Water is Better. A new Business made around water boxes"
              source="Boxed Water"
            />
            <DashboardCard
              gradient="from-zinc-800 via-zinc-900 to-black"
              title="New Unistellar with Fully Automatic Focusing and Light pollution Reduction"
              source="Unistellar Optics"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DashboardCard: React.FC<{
  onClick?: () => void;
  gradient: string;
  title: string;
  source: string;
}> = ({ onClick, gradient, title, source }) => (
  <div
    onClick={onClick}
    className={`group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
    <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
      <h3 className="text-sm font-bold text-white leading-tight mb-1 group-hover:underline decoration-white/30 underline-offset-4">
        {title}
      </h3>
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold">
          {source.charAt(0)}
        </div>
        <span className="text-[10px] text-zinc-400 font-medium">{source}</span>
        <Check size={8} className="text-blue-500 bg-white rounded-full p-[1px]" />
      </div>
    </div>
  </div>
);

const OfflineListPage: React.FC<{
  offlinePages: OfflinePage[];
  isSyncing: boolean;
  onSync: () => void;
  onDelete: (id: string) => void;
  onNavigate: (url: string) => void;
}> = ({ offlinePages, isSyncing, onSync, onDelete, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get all unique tags
  const allTags = Array.from(new Set(offlinePages.flatMap(p => p.tags || [])));

  // Filter pages
  const filteredPages = offlinePages.filter(page => {
    const matchesSearch = !searchQuery || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || page.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Stats
  const totalPages = offlinePages.length;
  const syncedCount = offlinePages.filter(p => p.synced).length;

  const handleOpenFolder = async () => {
    if ((window as any).electron?.offline?.openFolder) {
      await (window as any).electron.offline.openFolder();
    }
  };

  return (
    <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
              <DownloadCloud className="w-6 h-6" /> Reading List
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {totalPages} articles saved • {syncedCount} synced
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFolder}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors"
              title="Open folder"
            >
              <FolderOpen size={14} />
            </button>
            <button
              onClick={onSync}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md transition-colors"
            >
              <RefreshCcw size={12} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  !selectedTag ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Tag size={10} />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {filteredPages.length === 0 ? (
          <div className="py-20 text-center text-zinc-600">
            {offlinePages.length === 0 ? (
              <>
                <WifiOff size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-zinc-400">No offline pages saved</p>
                <p className="text-sm mt-2">Click the download icon in the address bar to save pages.</p>
              </>
            ) : (
              <>
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p>No articles match your search</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map(page => (
              <OfflinePageCard
                key={page.id}
                page={page}
                onRead={() => onNavigate(`serendib://read/${page.id}`)}
                onDelete={() => onDelete(page.id)}
                onOpenOriginal={() => onNavigate(page.url)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Offline Page Card Component
const OfflinePageCard: React.FC<{
  page: OfflinePage;
  onRead: () => void;
  onDelete: () => void;
  onOpenOriginal: () => void;
}> = ({ page, onRead, onDelete, onOpenOriginal }) => {
  const formattedDate = new Date(page.savedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: page.savedAt < Date.now() - 365 * 24 * 60 * 60 * 1000 ? 'numeric' : undefined,
  });

  return (
    <div className="group relative bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col">
      {/* Hero image if available */}
      {page.heroImage && (
        <div 
          className="h-32 bg-zinc-900 bg-cover bg-center"
          style={{ backgroundImage: `url(${page.heroImage})` }}
        />
      )}
      
      <div className="p-5 flex-1 flex flex-col">
        {/* Site name */}
        {page.siteName && (
          <div className="flex items-center gap-2 mb-2">
            {page.favicon && (
              <img src={page.favicon} alt="" className="w-4 h-4 rounded" />
            )}
            <span className="text-xs text-zinc-500 font-medium">{page.siteName}</span>
          </div>
        )}
        
        {/* Title */}
        <h3
          className="text-base font-semibold text-zinc-200 hover:text-white mb-2 line-clamp-2 cursor-pointer"
          onClick={onRead}
        >
          {page.title}
        </h3>
        
        {/* Excerpt */}
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{page.excerpt}</p>
        
        {/* Meta info */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-600 mb-3">
          {page.author && (
            <span className="flex items-center gap-1">
              <User size={10} />
              {page.author}
            </span>
          )}
          {page.readingTime && (
            <span className="flex items-center gap-1">
              <BookOpen size={10} />
              {page.readingTime} min
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {formattedDate}
          </span>
        </div>
        
        {/* Tags */}
        {page.tags && page.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {page.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[10px] rounded-full">
                {tag}
              </span>
            ))}
            {page.tags.length > 3 && (
              <span className="px-2 py-0.5 text-zinc-600 text-[10px]">+{page.tags.length - 3}</span>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
          <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
            <HardDrive size={10} />
            <span>{page.size}</span>
            <span className={page.synced ? 'text-green-500' : 'text-amber-500'}>
              • {page.synced ? 'Synced' : 'Local'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onOpenOriginal}
              className="p-1.5 text-zinc-600 hover:text-blue-400 transition-colors rounded"
              title="Open original"
            >
              <ExternalLink size={14} />
            </button>
            <button 
              onClick={onDelete}
              className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors rounded"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OfflineReaderPage: React.FC<{
  page: OfflinePage | undefined;
  showFindBar: boolean;
  onCloseFindBar: () => void;
  onNavigate: (url: string) => void;
}> = ({ page, showFindBar, onCloseFindBar, onNavigate }) => {
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');

  if (!page) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <FileText size={48} className="mb-4 opacity-20" />
        <p>Page not found or deleted.</p>
        <button onClick={() => onNavigate('serendib://offline')} className="mt-4 text-blue-500 hover:underline">
          Return to Reading List
        </button>
      </div>
    );
  }

  const themeStyles = {
    dark: 'bg-[#111] text-zinc-300',
    sepia: 'bg-[#f4ecd8] text-[#433422]',
    light: 'bg-white text-zinc-800',
  };

  const formattedDate = page.publishedDate 
    ? new Date(page.publishedDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date(page.savedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

  return (
    <div className={`flex-1 ${themeStyles[theme]} overflow-y-auto font-serif leading-relaxed relative`}>
      <FindBar isOpen={showFindBar} onClose={onCloseFindBar} />
      
      {/* Reader toolbar */}
      <div className="sticky top-0 z-10 bg-inherit border-b border-current/10">
        <div className="max-w-2xl mx-auto px-8 py-3 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('serendib://offline')} 
            className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity font-sans"
          >
            <ArrowRight size={14} className="rotate-180" /> Reading List
          </button>
          
          <div className="flex items-center gap-4">
            {/* Font size controls */}
            <div className="flex items-center gap-2 text-sm font-sans">
              <button 
                onClick={() => setFontSize(f => Math.max(14, f - 2))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-current/10 transition-colors"
              >
                A-
              </button>
              <span className="text-xs opacity-50">{fontSize}</span>
              <button 
                onClick={() => setFontSize(f => Math.min(24, f + 2))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-current/10 transition-colors"
              >
                A+
              </button>
            </div>
            
            {/* Theme toggle */}
            <div className="flex items-center gap-1 font-sans">
              <button
                onClick={() => setTheme('dark')}
                className={`w-6 h-6 rounded-full bg-zinc-900 border-2 ${theme === 'dark' ? 'border-blue-500' : 'border-transparent'}`}
                title="Dark"
              />
              <button
                onClick={() => setTheme('sepia')}
                className={`w-6 h-6 rounded-full bg-[#f4ecd8] border-2 ${theme === 'sepia' ? 'border-blue-500' : 'border-transparent'}`}
                title="Sepia"
              />
              <button
                onClick={() => setTheme('light')}
                className={`w-6 h-6 rounded-full bg-white border-2 ${theme === 'light' ? 'border-blue-500' : 'border-zinc-300'}`}
                title="Light"
              />
            </div>
            
            {/* Open original */}
            <button
              onClick={() => onNavigate(page.url)}
              className="flex items-center gap-1.5 text-xs font-sans opacity-60 hover:opacity-100 transition-opacity"
              title="Open original"
            >
              <ExternalLink size={12} />
              Original
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Article header */}
        <header className="mb-10">
          {page.siteName && (
            <div className="flex items-center gap-2 mb-4">
              {page.favicon && (
                <img src={page.favicon} alt="" className="w-5 h-5 rounded" />
              )}
              <span className="text-sm font-sans font-medium opacity-70">{page.siteName}</span>
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {page.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-sans opacity-60">
            {page.author && (
              <span className="flex items-center gap-1.5">
                <User size={14} />
                {page.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formattedDate}
            </span>
            {page.readingTime && (
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} />
                {page.readingTime} min read
              </span>
            )}
            {page.wordCount && (
              <span className="opacity-50">
                {page.wordCount.toLocaleString()} words
              </span>
            )}
          </div>
          
          {page.tags && page.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {page.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-current/10 text-xs font-sans rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>
        
        {/* Hero image */}
        {page.heroImage && (
          <div className="mb-10 -mx-8">
            <img 
              src={page.heroImage} 
              alt="" 
              className="w-full h-auto rounded-lg"
            />
          </div>
        )}
        
        {/* Article content */}
        <div 
          className="prose prose-lg max-w-none"
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: page.content }} 
        />
        
        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-current/10 text-center font-sans">
          <p className="text-xs opacity-40">
            Saved for offline reading on {new Date(page.savedAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => onNavigate(page.url)}
            className="mt-4 text-sm text-blue-500 hover:underline"
          >
            View original article →
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryPage: React.FC<{
  history: HistoryItem[];
  onClear: () => void;
  onNavigate: (url: string) => void;
}> = ({ history, onClear, onNavigate }) => (
  <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto font-sans">
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between pb-6 border-b border-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">History</h1>
        <button onClick={onClear} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors">
          Clear Data
        </button>
      </header>
      <div className="space-y-1">
        {history.length === 0 ? (
          <div className="py-20 text-center text-zinc-600"><p>No history.</p></div>
        ) : (
          history.slice().reverse().map(item => (
            <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-zinc-900 transition-colors">
              <div className="flex items-center space-x-4 overflow-hidden">
                <div className="text-zinc-600"><Clock size={14} /></div>
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

const SearchResultsPage: React.FC<{
  query: string | null;
  showFindBar: boolean;
  onCloseFindBar: () => void;
}> = ({ query, showFindBar, onCloseFindBar }) => (
  <div className="flex-1 bg-black p-8 overflow-y-auto font-sans relative">
    <FindBar isOpen={showFindBar} onClose={onCloseFindBar} />
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 border-b border-zinc-900 pb-4">
        <input value={query || ''} readOnly className="w-full pl-0 pr-4 py-2 bg-transparent text-xl font-light text-white focus:outline-none" />
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
          <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl line-clamp-2">{res.snippet}</p>
        </div>
      ))}
      <div className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-lg mt-12 flex items-start gap-3">
        <ShieldAlert className="text-zinc-500 shrink-0 w-4 h-4 mt-0.5" />
        <div>
          <h3 className="font-medium text-zinc-300 text-xs">Simulation Mode</h3>
          <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">External browsing is restricted in this demo environment.</p>
        </div>
      </div>
    </div>
  </div>
);

export default ContentFrame;
