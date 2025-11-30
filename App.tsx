import React, { useState, useEffect } from 'react';
import { TabSystem } from './components/TabSystem';
import { OmniBox } from './components/OmniBox';
import { ContentFrame } from './components/ContentFrame';
import { AIPanel } from './components/AIPanel';
import { ToastContainer } from './components/BrowserUI';
import { Tab, Bookmark, Workspace, HistoryItem, BrowserSettings, ThemeMode, Container, OfflinePage, DownloadItem, Extension, Notification } from './types';
import { INITIAL_BOOKMARKS, INITIAL_WORKSPACES, INITIAL_CONTAINERS, DEFAULT_HOME_URL, MOCK_DOWNLOADS, MOCK_EXTENSIONS } from './constants';
import { Minimize2, Plus, X } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // --- State ---
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-1');
  const [containers, setContainers] = useState<Container[]>(INITIAL_CONTAINERS);
  
  const [tabs, setTabs] = useState<Tab[]>([{
    id: 'tab-init',
    title: 'New Tab',
    url: DEFAULT_HOME_URL,
    isLoading: false,
    history: [DEFAULT_HOME_URL],
    historyIndex: 0,
    workspaceId: 'ws-1',
    containerId: 'cont-default'
  }]);
  
  const [activeTabId, setActiveTabId] = useState('tab-init');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [offlinePages, setOfflinePages] = useState<OfflinePage[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>(MOCK_DOWNLOADS);
  const [extensions, setExtensions] = useState<Extension[]>(MOCK_EXTENSIONS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  
  // Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const [settings, setSettings] = useState<BrowserSettings>({
    homeUrl: DEFAULT_HOME_URL,
    searchEngine: 'Google',
    theme: ThemeMode.DARK,
    enableAdBlock: true,
    privacyMode: false,
    language: 'en-US',
    verticalTabs: true,
    accentColor: 'blue',
    dataSaver: false,
    memorySaver: true,
    lowSpecMode: false,
  });

  // --- Theme Effect ---
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // --- Shortcuts Effect ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindBar(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Derived State ---
  const visibleTabs = tabs.filter(t => t.workspaceId === activeWorkspaceId);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeContainer = containers.find(c => c.id === activeTab?.containerId) || containers[0];
  const isCurrentPageSaved = !!offlinePages.find(p => p.url === activeTab?.url);

  // --- Actions ---
  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = generateId();
    setNotifications(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const getInternalTitle = (url: string) => {
    if (url.includes('newtab')) return 'New Tab';
    if (url.includes('settings')) return 'Settings';
    if (url.includes('history')) return 'History';
    if (url.includes('offline')) return 'Reading List';
    if (url.includes('downloads')) return 'Downloads';
    if (url.includes('extensions')) return 'Extensions';
    return 'Serendib';
  };

  const handleNavigate = (input: string) => {
    let url = input;
    if (!url.startsWith('http') && !url.startsWith('serendib://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = `https://${url}`;
      } else {
        url = `https://search?q=${encodeURIComponent(url)}`;
      }
    }

    updateTab(activeTabId, { 
      url, 
      isLoading: true,
      title: url.startsWith('serendib://') ? getInternalTitle(url) : url 
    });

    setTimeout(() => {
      updateTab(activeTabId, { isLoading: false });
      addToHistory(url);
    }, 800);
  };

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const newTab = { ...t, ...updates };
      if (updates.url && updates.url !== t.url) {
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        newHistory.push(updates.url);
        newTab.history = newHistory;
        newTab.historyIndex = newHistory.length - 1;
      }
      return newTab;
    }));
  };

  const handleCreateTab = (containerId?: string) => {
    const newId = generateId();
    const targetContainerId = containerId || 'cont-default';

    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: DEFAULT_HOME_URL,
      isLoading: false,
      history: [DEFAULT_HOME_URL],
      historyIndex: 0,
      workspaceId: activeWorkspaceId,
      containerId: targetContainerId
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCreateDisposableTab = () => {
    const dispId = `cont-disp-${generateId()}`;
    const newContainer: Container = {
      id: dispId,
      name: 'Disposable',
      icon: 'Trash2',
      color: '#ef4444',
      isDisposable: true
    };
    setContainers(prev => [...prev, newContainer]);
    handleCreateTab(dispId);
    addNotification('Disposable Tab Created', 'This context will be destroyed when the tab is closed.', 'info');
  };

  const handleRenameTab = (tabId: string, newTitle: string) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, title: newTitle } : t
    ));
  };

  const handleCloseTab = (id: string) => {
    const tabToClose = tabs.find(t => t.id === id);
    if (!tabToClose) return;

    const remainingTabs = tabs.filter(t => t.id !== id);
    const remainingInWorkspace = remainingTabs.filter(t => t.workspaceId === tabToClose.workspaceId);
    
    const containerId = tabToClose.containerId;
    const container = containers.find(c => c.id === containerId);
    
    if (container && container.isDisposable) {
      const otherTabsUsingContainer = remainingTabs.some(t => t.containerId === containerId);
      if (!otherTabsUsingContainer) {
        setContainers(prev => prev.filter(c => c.id !== containerId));
        addNotification('Session Destroyed', 'Disposable container and data cleared.', 'success');
      }
    }

    if (remainingInWorkspace.length === 0) {
      const newId = generateId();
      const newTab: Tab = {
        id: newId,
        title: 'New Tab',
        url: DEFAULT_HOME_URL,
        isLoading: false,
        history: [DEFAULT_HOME_URL],
        historyIndex: 0,
        workspaceId: tabToClose.workspaceId,
        containerId: 'cont-default'
      };
      setTabs([...remainingTabs, newTab]);
      if (activeTabId === id) setActiveTabId(newId);
    } else {
      setTabs(remainingTabs);
      if (activeTabId === id) {
        setActiveTabId(remainingInWorkspace[remainingInWorkspace.length - 1].id);
      }
    }
  };

  const handleSwitchContainer = (tabId: string, containerId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
       const oldContainerId = tab.containerId;
       updateTab(tabId, { containerId });

       const oldContainer = containers.find(c => c.id === oldContainerId);
       if (oldContainer && oldContainer.isDisposable) {
          const others = tabs.filter(t => t.id !== tabId && t.containerId === oldContainerId);
          if (others.length === 0) {
             setContainers(prev => prev.filter(c => c.id !== oldContainerId));
          }
       }
    }
  };

  const handleSaveOffline = () => {
    if (!activeTab || activeTab.url.startsWith('serendib://')) return;
    if (isCurrentPageSaved) return;

    updateTab(activeTabId, { isLoading: true });

    setTimeout(() => {
        const newPage: OfflinePage = {
          id: generateId(),
          title: activeTab.title,
          url: activeTab.url,
          excerpt: `Saved version of ${activeTab.title}.`,
          content: `<article class="prose dark:prose-invert max-w-none"><h1 class="text-4xl font-bold mb-4">${activeTab.title}</h1><p>Offline content saved.</p></article>`,
          savedAt: Date.now(),
          synced: false,
          size: '0.8 MB'
        };
        
        setOfflinePages(prev => [newPage, ...prev]);
        updateTab(activeTabId, { isLoading: false });
        addNotification('Page Saved', 'Content available in offline reading list.', 'success');
    }, 1000);
  };

  const handleCreateWorkspace = () => {
    const newId = generateId();
    const newWorkspace: Workspace = {
      id: newId,
      name: 'New Space',
      icon: 'Layers',
      tabIds: []
    };
    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveWorkspaceId(newId);
    const tabId = generateId();
    setTabs(prev => [...prev, {
      id: tabId,
      title: 'New Tab',
      url: DEFAULT_HOME_URL,
      isLoading: false,
      history: [DEFAULT_HOME_URL],
      historyIndex: 0,
      workspaceId: newId,
      containerId: 'cont-default'
    }]);
    setActiveTabId(tabId);
  };

  const handleRenameWorkspace = (id: string, name: string) => {
    setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, name } : ws));
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) return;
    setWorkspaces(prev => prev.filter(ws => ws.id !== id));
    setTabs(prev => prev.filter(t => t.workspaceId !== id));
    if (activeWorkspaceId === id) {
      const nextWs = workspaces.find(ws => ws.id !== id);
      if (nextWs) {
        setActiveWorkspaceId(nextWs.id);
        const tabInNextWs = tabs.find(t => t.workspaceId === nextWs.id);
        if (tabInNextWs) setActiveTabId(tabInNextWs.id);
      }
    }
  };

  const handleBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const newIndex = activeTab.historyIndex - 1;
    const prevUrl = activeTab.history[newIndex];
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, historyIndex: newIndex, url: prevUrl, title: prevUrl.startsWith('serendib://') ? getInternalTitle(prevUrl) : prevUrl } : t));
  };

  const handleForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const newIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[newIndex];
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, historyIndex: newIndex, url: nextUrl, title: nextUrl.startsWith('serendib://') ? getInternalTitle(nextUrl) : nextUrl } : t));
  };
  
  const handleHistoryJump = (tabId: string, index: number) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      const newUrl = t.history[index];
      return { ...t, historyIndex: index, url: newUrl, title: newUrl.startsWith('serendib://') ? getInternalTitle(newUrl) : newUrl };
    }));
    setActiveTabId(tabId);
  };

  const addToHistory = (url: string) => {
    if (settings.privacyMode) return;
    if (url.startsWith('serendib://read/')) return;
    const item: HistoryItem = { id: generateId(), title: activeTab?.title || url, url, timestamp: Date.now() };
    setHistory(prev => [...prev, item]);
  };

  const toggleBookmark = () => {
    if (!activeTab) return;
    const exists = bookmarks.find(b => b.url === activeTab.url);
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.url !== activeTab.url));
    } else {
      setBookmarks(prev => [...prev, { id: generateId(), title: activeTab.title, url: activeTab.url, dateAdded: Date.now() }]);
      addNotification('Bookmark Added', 'Page saved to bookmarks.', 'success');
    }
  };

  const handleReorderTabs = (draggedTabId: string, targetTabId: string) => {
    if (draggedTabId === targetTabId) return;
    setTabs(prev => {
      const newTabs = [...prev];
      const draggedIndex = newTabs.findIndex(t => t.id === draggedTabId);
      const targetIndex = newTabs.findIndex(t => t.id === targetTabId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const [removed] = newTabs.splice(draggedIndex, 1);
      newTabs.splice(targetIndex, 0, removed);
      return newTabs;
    });
  };

  const handleMoveTabToWorkspace = (tabId: string, targetWorkspaceId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.workspaceId === targetWorkspaceId) return;
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, workspaceId: targetWorkspaceId } : t));
    if (activeTabId === tabId) {
      const remainingInWs = tabs.filter(t => t.workspaceId === activeWorkspaceId && t.id !== tabId);
      if (remainingInWs.length > 0) setActiveTabId(remainingInWs[remainingInWs.length - 1].id);
      else handleCreateTab();
    }
  };

  const handleToggleExtension = (id: string) => {
    setExtensions(prev => prev.map(ext => ext.id === id ? { ...ext, enabled: !ext.enabled } : ext));
  };

  const handleRemoveExtension = (id: string) => {
    setExtensions(prev => prev.filter(ext => ext.id !== id));
    addNotification('Extension Removed', 'Extension has been uninstalled.', 'info');
  };

  const showVerticalTabs = !isFocusMode && settings.verticalTabs;
  const showHorizontalTabs = !isFocusMode && !settings.verticalTabs;

  return (
    <div className="flex h-screen w-screen overflow-hidden text-sm bg-[#050505] text-zinc-100 font-sans selection:bg-zinc-800">
      
      {/* 1. Sidebar (Vertical Tabs) */}
      {showVerticalTabs && (
        <TabSystem 
          tabs={visibleTabs}
          activeTabId={activeTabId}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          containers={containers}
          onTabSelect={setActiveTabId}
          onTabClose={handleCloseTab}
          onTabCreate={() => handleCreateTab()}
          onRenameTab={handleRenameTab}
          onWorkspaceSelect={setActiveWorkspaceId}
          onNavigateHistory={handleHistoryJump}
          onReorderTabs={handleReorderTabs}
          onMoveTabToWorkspace={handleMoveTabToWorkspace}
          
          onCreateWorkspace={handleCreateWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          
          onChangeTabContainer={handleSwitchContainer}
          onCreateDisposableTab={handleCreateDisposableTab}
        />
      )}

      {/* 2. Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505] relative">
        
        {/* Horizontal Tab Strip */}
        {showHorizontalTabs && (
          <div className="flex items-center h-10 bg-[#050505] px-2 gap-1 overflow-x-auto scrollbar-none border-b border-white/5 shrink-0 pt-1">
            {visibleTabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  group relative flex items-center h-full px-3 rounded-t-lg min-w-[140px] max-w-[220px] text-xs font-medium cursor-pointer transition-all border-t border-x
                  ${activeTabId === tab.id 
                    ? 'bg-white/10 text-white border-white/5 shadow-sm z-10' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/5'
                  }
                `}
              >
                 <div 
                    className="w-1.5 h-1.5 rounded-full mr-2"
                    style={{ backgroundColor: containers.find(c => c.id === tab.containerId)?.color || '#3b82f6' }}
                 />
                 <span className="truncate flex-1 mr-2">{tab.title}</span>
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                   className="p-0.5 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <X size={12} />
                 </button>
              </div>
            ))}
            <button 
              onClick={() => handleCreateTab()} 
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        )}

        {/* OmniBox */}
        {!isFocusMode && (
          <OmniBox 
            url={activeTab?.url || ''}
            isLoading={activeTab?.isLoading || false}
            activeContainer={activeContainer}
            containers={containers}
            onNavigate={handleNavigate}
            onRefresh={() => handleNavigate(activeTab?.url || DEFAULT_HOME_URL)}
            onBack={handleBack}
            onForward={handleForward}
            onNewTab={handleCreateTab}
            onNewTabInContainer={handleCreateTab}
            onNewDisposableTab={handleCreateDisposableTab}
            onToggleAI={() => setIsAiOpen(!isAiOpen)}
            isAiOpen={isAiOpen}
            isBookmarked={!!bookmarks.find(b => b.url === activeTab?.url)}
            onToggleBookmark={toggleBookmark}
            onToggleFocus={() => setIsFocusMode(true)}
            onSaveOffline={handleSaveOffline}
            isOfflineSaved={isCurrentPageSaved}
          />
        )}
        
        <div className="flex-1 flex overflow-hidden relative">
          <ContentFrame 
            activeTab={activeTab}
            bookmarks={bookmarks}
            history={history}
            offlinePages={offlinePages}
            downloads={downloads}
            extensions={extensions}
            settings={settings}
            showFindBar={showFindBar}
            onCloseFindBar={() => setShowFindBar(false)}
            onNavigate={handleNavigate}
            onDeleteBookmark={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))}
            onClearHistory={() => setHistory([])}
            onUpdateSetting={(k, v) => setSettings(prev => ({...prev, [k]: v}))}
            onDeleteOfflinePage={(id) => setOfflinePages(prev => prev.filter(p => p.id !== id))}
            onSyncOfflinePages={() => {}}
            onClearDownloads={() => setDownloads([])}
            onToggleExtension={handleToggleExtension}
            onRemoveExtension={handleRemoveExtension}
          />
          
          <AIPanel 
            isOpen={isAiOpen} 
            onClose={() => setIsAiOpen(false)}
            currentUrl={activeTab?.url || ''}
          />

          <ToastContainer 
            notifications={notifications} 
            onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
          />

          {isFocusMode && (
            <div className="absolute bottom-8 right-8 z-50 animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => setIsFocusMode(false)}
                className="flex items-center space-x-2 bg-white/90 text-zinc-900 px-5 py-3 rounded-full shadow-2xl hover:scale-105 hover:bg-white transition-all backdrop-blur-md border border-white/10"
                title="Exit Focus Mode"
              >
                <Minimize2 size={18} />
                <span className="font-medium text-sm">Exit Focus</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;