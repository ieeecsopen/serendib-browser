/**
 * Content Frame Component
 * 
 * Main content area that renders either internal pages or WebViews
 * for external URLs. Designed with Sri Lankan cultural context.
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
  Tag, Calendar, User, ExternalLink, FolderOpen, HardDrive,
  Palmtree, Mountain, Waves, Sun, MapPin, Newspaper, TrendingUp,
  Coffee, Compass, Globe2, Star, Crown, Sparkles
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

  // Sri Lankan themed background animation for new tab
  useEffect(() => {
    if (activeTab?.url !== 'serendib://newtab') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    // Sri Lankan themed colors - amber/gold, emerald green (tea), deep maroon
    const blobs = [
      { x: width * 0.2, y: height * 0.4, r: 600, color: 'rgba(180, 83, 9, 0.12)', vx: 0.2, vy: 0.1 }, // Amber
      { x: width * 0.8, y: height * 0.3, r: 500, color: 'rgba(234, 88, 12, 0.10)', vx: -0.3, vy: 0.2 }, // Orange
      { x: width * 0.5, y: height * -0.1, r: 800, color: 'rgba(6, 78, 59, 0.15)', vx: 0.1, vy: 0.1 }, // Emerald (tea)
      { x: width * 0.9, y: height * 0.9, r: 400, color: 'rgba(127, 29, 29, 0.12)', vx: -0.2, vy: -0.2 }, // Maroon (lion flag)
      { x: width * 0.1, y: height * 0.8, r: 350, color: 'rgba(202, 138, 4, 0.08)', vx: 0.15, vy: -0.1 }, // Gold
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

// Helper function to format time ago
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Sidebar App Icon Component
const SidebarAppIcon: React.FC<{
  name: string;
  url: string;
  logo: string;
  onNavigate: (url: string) => void;
}> = ({ name, url, logo, onNavigate }) => {
  return (
    <button
      onClick={() => onNavigate(url)}
      className="group relative w-10 h-10 flex items-center justify-center transition-all duration-200"
      title={name}
    >
      <img 
        src={logo} 
        alt={name}
        className="w-6 h-6 object-contain group-hover:scale-125 transition-transform duration-200"
      />
      
      {/* Tooltip */}
      <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
        {name}
      </div>
    </button>
  );
};

// News article type
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  source: { name: string };
  publishedAt: string;
  category?: string;
}

const NewTabPage: React.FC<{
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onNavigate: (url: string) => void;
}> = ({ canvasRef, onNavigate }) => {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('සුභ උදෑසනක්'); // Good Morning
    else if (hour < 17) setGreeting('සුභ දවසක්'); // Good Afternoon  
    else setGreeting('සුභ සන්ධ්‍යාවක්'); // Good Evening

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch news on mount
  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      setNewsError(null);
      
      try {
        // Using NewsAPI for Sri Lanka news - you can replace with your own API key
        // For demo, using a proxy or fallback to mock data
        const response = await fetch(
          'https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=demo'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          setNews(data.articles.slice(0, 5));
        } else {
          // Fallback to curated news sources
          throw new Error('No articles found');
        }
      } catch (error) {
        // Fallback to RSS/static featured news for Sri Lanka
        const fallbackNews: NewsArticle[] = [
          {
            title: "Sri Lanka's Economy Shows Signs of Recovery",
            description: "The Central Bank reports positive indicators as tourism rebounds and exports increase steadily.",
            url: "https://www.newsfirst.lk",
            urlToImage: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&q=80",
            source: { name: "News First" },
            publishedAt: new Date().toISOString(),
            category: "Economy"
          },
          {
            title: "New Wildlife Sanctuary Opens in Southern Province",
            description: "Conservation efforts expand with a new protected area for endangered species.",
            url: "https://www.dailymirror.lk",
            urlToImage: "https://images.unsplash.com/photo-1602527076644-59e188249ae8?w=600&q=80",
            source: { name: "Daily Mirror" },
            publishedAt: new Date().toISOString(),
            category: "Environment"
          },
          {
            title: "Tech Startups Thrive in Colombo's Innovation Hub",
            description: "The startup ecosystem continues to grow with new funding and international partnerships.",
            url: "https://www.ft.lk",
            urlToImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",
            source: { name: "FT" },
            publishedAt: new Date().toISOString(),
            category: "Technology"
          },
          {
            title: "Cricket: Sri Lanka Prepares for Upcoming Series",
            description: "National team training intensifies ahead of the international cricket calendar.",
            url: "https://www.espncricinfo.com",
            urlToImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80",
            source: { name: "ESPNcricinfo" },
            publishedAt: new Date().toISOString(),
            category: "Sports"
          },
          {
            title: "Cultural Festival Celebrates Traditional Arts",
            description: "Annual festival showcases Sri Lankan heritage with music, dance, and crafts.",
            url: "https://www.sundaytimes.lk",
            urlToImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80",
            source: { name: "Sunday Times" },
            publishedAt: new Date().toISOString(),
            category: "Culture"
          }
        ];
        setNews(fallbackNews);
        setNewsError(null); // Don't show error for fallback
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
    // Refresh news every 5 minutes
    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, []);

  // Quick links with real favicons/logos
  const quickLinks = [
    { 
      name: 'Google', 
      url: 'https://www.google.com', 
      logo: 'https://www.google.com/favicon.ico',
      color: 'from-blue-500 to-green-500' 
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com', 
      logo: 'https://www.youtube.com/favicon.ico',
      color: 'from-red-600 to-red-700' 
    },
    { 
      name: 'Facebook', 
      url: 'https://www.facebook.com', 
      logo: 'https://www.facebook.com/favicon.ico',
      color: 'from-blue-600 to-blue-700' 
    },
    { 
      name: 'Twitter', 
      url: 'https://twitter.com', 
      logo: 'https://abs.twimg.com/favicons/twitter.3.ico',
      color: 'from-sky-500 to-sky-600' 
    },
    { 
      name: 'WhatsApp', 
      url: 'https://web.whatsapp.com', 
      logo: 'https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png',
      color: 'from-green-500 to-green-600' 
    },
    { 
      name: 'Gmail', 
      url: 'https://mail.google.com', 
      logo: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
      color: 'from-red-500 to-yellow-500' 
    },
    { 
      name: 'News First', 
      url: 'https://www.newsfirst.lk', 
      logo: 'https://www.newsfirst.lk/favicon.ico',
      color: 'from-red-600 to-red-800' 
    },
    { 
      name: 'Dialog', 
      url: 'https://www.dialog.lk', 
      logo: 'https://www.dialog.lk/favicon.ico',
      color: 'from-orange-500 to-red-600' 
    },
  ];

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col font-sans select-none" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-primary))' }} />
      
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Most Accessed Apps in Sri Lanka - Sidebar */}
        <div className="hidden lg:flex w-16 flex-col items-center py-6 gap-2 border-r border-white/5 bg-white/[0.01] backdrop-blur-[1px]">
          {/* Serendib Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-900/30 mb-2">
            🦁
          </div>
          <div className="w-8 h-px bg-white/10 mb-2" />
          
          {/* Popular Sri Lankan Apps */}
          <SidebarAppIcon 
            name="WhatsApp" 
            url="https://web.whatsapp.com" 
            logo="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            onNavigate={onNavigate}
          />
          <SidebarAppIcon 
            name="Facebook" 
            url="https://www.facebook.com" 
            logo="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
            onNavigate={onNavigate}
          />
          <SidebarAppIcon 
            name="YouTube" 
            url="https://www.youtube.com" 
            logo="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg"
            onNavigate={onNavigate}
          />
          <SidebarAppIcon 
            name="TikTok" 
            url="https://www.tiktok.com" 
            logo="https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png"
            onNavigate={onNavigate}
          />
          <SidebarAppIcon 
            name="Instagram" 
            url="https://www.instagram.com" 
            logo="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg"
            onNavigate={onNavigate}
          />
          
          <div className="w-6 h-px bg-white/10 my-1" />
          
          {/* Sri Lankan Services */}
          <SidebarAppIcon 
            name="Dialog" 
            url="https://www.dialog.lk" 
            logo="https://www.dialog.lk/favicon.ico"
            onNavigate={onNavigate}
          />
          <SidebarAppIcon 
            name="Mobitel" 
            url="https://www.mobitel.lk" 
            logo="https://www.mobitel.lk/sites/default/files/favicon.ico"
            onNavigate={onNavigate}
          />
          
          <div className="mt-auto space-y-2">
            <SidebarAppIcon 
              name="Gmail" 
              url="https://mail.google.com" 
              logo="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico"
              onNavigate={onNavigate}
            />
            <SidebarAppIcon 
              name="Google" 
              url="https://www.google.com" 
              logo="https://www.google.com/favicon.ico"
              onNavigate={onNavigate}
            />
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent font-display">
                Serendib
              </div>
              <span className="text-xs text-zinc-600 hidden sm:block">ශ්‍රී ලංකාව</span>
            </div>
            <div className="flex items-center gap-6 text-zinc-400">
              <button onClick={() => onNavigate('serendib://newtab')} className="hover:text-white transition-colors"><Home size={20} strokeWidth={1.5} /></button>
              <button className="hover:text-white transition-colors"><Bell size={20} strokeWidth={1.5} /></button>
              <button onClick={() => onNavigate('serendib://settings')} className="hover:text-white transition-colors"><Sliders size={18} strokeWidth={1.5} /></button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <div className="text-xs text-zinc-500">{currentTime.toLocaleDateString('en-LK', { weekday: 'long' })}</div>
                <div className="text-sm font-medium text-zinc-300">{currentTime.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 border-2 border-amber-500/30 overflow-hidden cursor-pointer hover:border-amber-400 transition-colors flex items-center justify-center text-white font-semibold">
                S
              </div>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center pt-4 pb-24 px-8 w-full max-w-7xl mx-auto">
            {/* Greeting */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl md:text-4xl font-light text-white/90 mb-2">{greeting}</h1>
              <p className="text-zinc-500 text-sm">Welcome to Serendib - The Pearl of the Indian Ocean</p>
            </div>

            {/* Search Bar - 21st.dev inspired with enhanced glow */}
            <div className="w-full max-w-2xl relative mb-12 group z-20">
              {/* Outer glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-600/30 via-orange-500/20 to-red-600/30 rounded-3xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              
              {/* Inner glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/40 via-orange-500/30 to-amber-600/40 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/[0.08] group-focus-within:border-amber-500/40 rounded-2xl transition-all duration-300 overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                
                <div className="relative flex items-center">
                  <div className="pl-5 text-zinc-500">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="සොයන්න... Search Google or enter URL"
                    className="flex-1 bg-transparent py-4 px-4 text-lg text-white placeholder:text-zinc-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onNavigate(e.currentTarget.value);
                      }
                    }}
                    autoFocus
                  />
                  <button className="mr-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium hover:from-amber-500 hover:to-orange-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-amber-900/30">
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links - Enhanced 21st.dev style with real logos */}
            <div className="w-full max-w-3xl mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={12} className="text-amber-500" /> Quick Access
                </h2>
                <button className="text-xs text-zinc-600 hover:text-amber-500 transition-colors flex items-center gap-1 group">
                  <Plus size={12} /> Add Site
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {quickLinks.map((link, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate(link.url)}
                    className="group relative flex flex-col items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-15 transition-opacity duration-300 blur-xl`} />
                    
                    {/* Logo container with fallback gradient */}
                    <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                      <img 
                        src={link.logo} 
                        alt={link.name}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          // Fallback to first letter if logo fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-letter')) {
                            const span = document.createElement('span');
                            span.className = 'fallback-letter text-white font-bold text-lg';
                            span.textContent = link.name.charAt(0).toUpperCase();
                            parent.appendChild(span);
                          }
                        }}
                      />
                    </div>
                    <span className="relative text-[10px] text-zinc-500 group-hover:text-white transition-colors truncate w-full text-center font-medium">{link.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured News - Live Feed */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Newspaper size={14} className="text-amber-500" /> Featured News
                  {newsLoading && (
                    <span className="ml-2 w-3 h-3 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                  )}
                </h2>
                <button 
                  onClick={() => onNavigate('https://news.google.com/search?q=sri+lanka')}
                  className="text-xs text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 group"
                >
                  View All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {/* News Bento Grid Layout */}
              {newsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-2xl bg-white/[0.02] border border-white/[0.08] animate-pulse ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                    >
                      <div className="h-full flex flex-col justify-end p-5">
                        <div className="h-3 bg-zinc-800 rounded w-16 mb-2" />
                        <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-zinc-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : newsError ? (
                <div className="text-center py-12 text-zinc-500">
                  <Newspaper size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Unable to load news</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 text-xs text-amber-500 hover:text-amber-400"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
                  {news.map((article, index) => {
                    const glowColors: Array<'amber' | 'rose' | 'emerald' | 'sky' | 'yellow'> = ['amber', 'rose', 'emerald', 'sky', 'yellow'];
                    const gradients = [
                      'from-amber-600/20 via-orange-900/40 to-black',
                      'from-rose-600/20 via-pink-900/40 to-black',
                      'from-emerald-600/20 via-green-900/40 to-black',
                      'from-sky-600/20 via-blue-900/40 to-black',
                      'from-yellow-600/20 via-amber-900/40 to-black',
                    ];
                    const categoryColors: Record<string, string> = {
                      'Economy': 'text-amber-300',
                      'Environment': 'text-emerald-300',
                      'Technology': 'text-sky-300',
                      'Sports': 'text-rose-300',
                      'Culture': 'text-purple-300',
                      'default': 'text-zinc-300'
                    };

                    const isMainArticle = index === 0;
                    const timeAgo = getTimeAgo(article.publishedAt);

                    return (
                      <BentoCard
                        key={index}
                        onClick={() => onNavigate(article.url)}
                        className={isMainArticle ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1'}
                        gradient={gradients[index % gradients.length]}
                        glowColor={glowColors[index % glowColors.length]}
                        imageUrl={article.urlToImage || `https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80`}
                      >
                        <div className={`relative z-10 h-full flex flex-col ${isMainArticle ? 'justify-between p-6' : 'justify-end p-5'}`}>
                          {isMainArticle && (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 backdrop-blur-sm text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-red-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider drop-shadow-md ${categoryColors[article.category || 'default'] || categoryColors.default}`}>
                                {article.source.name}
                              </span>
                              <span className="text-[9px] text-zinc-400">• {timeAgo}</span>
                            </div>
                            <h3 className={`font-bold text-white group-hover:text-amber-100 transition-colors drop-shadow-lg line-clamp-2 ${isMainArticle ? 'text-xl md:text-2xl mb-2' : 'text-sm'}`}>
                              {article.title}
                            </h3>
                            {isMainArticle && article.description && (
                              <p className="text-sm text-zinc-300 line-clamp-2 drop-shadow-md">
                                {article.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </BentoCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ceylon Tea CTA Section - 21st.dev inspired with shimmer effect */}
            <div className="w-full mt-10 group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-green-900/40 to-emerald-950/60 border border-emerald-500/20 p-6 hover:border-emerald-500/40 transition-all duration-500">
                {/* Animated gradient shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
                    <Coffee size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">World Famous Ceylon Tea</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/30">
                        #1 Quality
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">Explore the lush tea plantations of Nuwara Eliya and taste the finest tea in the world</p>
                  </div>
                  <button 
                    onClick={() => onNavigate('https://www.pureceylontea.com')}
                    className="relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/50 hover:scale-105 overflow-hidden group/btn"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Explore <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="px-8 py-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-zinc-600">
              Serendib Browser • Made with ❤️ in Sri Lanka • <span className="text-amber-600">ජය ශ්‍රී ලංකා</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

// 21st.dev inspired Bento Card Component with glassmorphism, glow effects, and image support
const BentoCard: React.FC<{
  onClick?: () => void;
  className?: string;
  gradient: string;
  glowColor: 'amber' | 'rose' | 'emerald' | 'sky' | 'yellow' | 'purple';
  imageUrl?: string;
  children: React.ReactNode;
}> = ({ onClick, className = '', gradient, glowColor, imageUrl, children }) => {
  const glowColors = {
    amber: 'group-hover:shadow-amber-500/20',
    rose: 'group-hover:shadow-rose-500/20',
    emerald: 'group-hover:shadow-emerald-500/20',
    sky: 'group-hover:shadow-sky-500/20',
    yellow: 'group-hover:shadow-yellow-500/20',
    purple: 'group-hover:shadow-purple-500/20',
  };
  
  const borderColors = {
    amber: 'group-hover:border-amber-500/40',
    rose: 'group-hover:border-rose-500/40',
    emerald: 'group-hover:border-emerald-500/40',
    sky: 'group-hover:border-sky-500/40',
    yellow: 'group-hover:border-yellow-500/40',
    purple: 'group-hover:border-purple-500/40',
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-2xl overflow-hidden cursor-pointer
        bg-white/[0.02] backdrop-blur-sm
        border border-white/[0.08] ${borderColors[glowColor]}
        transition-all duration-500 ease-out
        hover:-translate-y-1 hover:shadow-2xl ${glowColors[glowColor]}
        ${className}
      `}
    >
      {/* Background Image */}
      {imageUrl && (
        <div className="absolute inset-0">
          <img 
            src={imageUrl} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </div>
      )}
      
      {/* Animated gradient background (shown if no image) */}
      {!imageUrl && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
      )}
      
      {/* Color tint overlay for images */}
      {imageUrl && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-30 group-hover:opacity-40 transition-opacity duration-500 mix-blend-overlay`} />
      )}
      
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
      }} />
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
      
      {/* Content */}
      {children}
    </div>
  );
};

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
