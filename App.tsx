import React, { useState, useEffect } from 'react';
import { TabSystem } from './src/components/layout/TabSystem';
import { HorizontalTabBar } from './src/components/layout/HorizontalTabBar';
import { SplitViewContainer } from './src/components/layout/SplitViewContainer';
import { OmniBox } from './src/components/navigation/OmniBox';
import { AIPanel } from './src/components/ai/AIPanel';
import { ToastContainer } from './src/components/ui/ToastContainer';
import { WindowControls } from './src/components/layout/WindowControls';
import { ContentFrame } from './src/components/pages/ContentFrame';
import { SnapshotManager } from './src/components/snapshots/SnapshotManager';
import { SavePasswordPrompt } from './src/components/passwords/SavePasswordPrompt';
import type { Tab, Bookmark, Workspace, HistoryItem, BrowserSettings, Container, OfflinePage, DownloadItem, Extension, Notification, WorkspaceSnapshot, SnapshotImportOptions, SitePermissions, PermissionType, PermissionSetting } from './src/types';
import { ThemeMode } from './src/types/settings';
import { INITIAL_BOOKMARKS, INITIAL_WORKSPACES, INITIAL_CONTAINERS, DEFAULT_HOME_URL, MOCK_DOWNLOADS, MOCK_EXTENSIONS, DEFAULT_PERMISSIONS } from './src/constants';
import { snapshotTabsToTabs, snapshotWorkspacesToWorkspaces, snapshotContainersToContainers } from './src/services/snapshot';
import { saveCredential, extractDomain, isVaultUnlocked, credentialExists } from './src/services';
import { getTheme, applyTheme } from './src/constants/themes';
import { Minimize2, EyeOff } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Private container for incognito mode
const PRIVATE_CONTAINER: Container = {
  id: 'cont-private',
  name: 'Private',
  icon: 'EyeOff',
  color: '#6366f1',
  isDisposable: true,
};

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
  
  // Recently closed tabs for Ctrl+Shift+T
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<Tab[]>([]);
  
  // Private/Incognito mode state
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  
  // Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Full Screen State
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Split View State
  const [splitView, setSplitView] = useState<{
    enabled: boolean;
    leftTabId: string | null;
    rightTabId: string | null;
    splitRatio: number; // 0.5 = 50/50
  }>({
    enabled: false,
    leftTabId: null,
    rightTabId: null,
    splitRatio: 0.5,
  });
  
  // Snapshot Manager State
  const [isSnapshotManagerOpen, setIsSnapshotManagerOpen] = useState(false);
  
  // Password Save Prompt State
  const [passwordPrompt, setPasswordPrompt] = useState<{
    isVisible: boolean;
    domain: string;
    username: string;
    password: string;
    favicon?: string;
    isUpdate: boolean;
  }>({
    isVisible: false,
    domain: '',
    username: '',
    password: '',
    isUpdate: false,
  });
  
  // Sites that should never save passwords
  const [neverSaveSites, setNeverSaveSites] = useState<string[]>(() => {
    const saved = localStorage.getItem('serendib-never-save-passwords');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Site permissions state
  const [sitePermissionsMap, setSitePermissionsMap] = useState<Record<string, SitePermissions>>(() => {
    const saved = localStorage.getItem('serendib-site-permissions');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [settings, setSettings] = useState<BrowserSettings>({
    homeUrl: DEFAULT_HOME_URL,
    searchEngine: 'DuckDuckGo',
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
    // Apply custom theme based on settings
    const theme = getTheme(settings.theme);
    applyTheme(theme);
  }, [settings.theme]);

  // --- Shortcuts Effect ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Ctrl/Cmd + T - New Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && !e.shiftKey) {
        e.preventDefault();
        handleCreateTab();
      }
      
      // Ctrl/Cmd + W - Close Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        handleCloseTab(activeTabId);
      }
      
      // Ctrl/Cmd + Shift + T - Reopen Closed Tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        handleReopenClosedTab();
      }
      
      // Ctrl/Cmd + Shift + N - New Private Window/Tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        handleCreatePrivateTab();
      }
      
      // Ctrl/Cmd + 1-9 - Switch to Tab
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < visibleTabs.length) {
          setActiveTabId(visibleTabs[tabIndex].id);
        }
      }
      
      // Ctrl/Cmd + Tab - Next Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = visibleTabs.findIndex(t => t.id === activeTabId);
        const nextIndex = (currentIndex + 1) % visibleTabs.length;
        setActiveTabId(visibleTabs[nextIndex].id);
      }
      
      // Ctrl/Cmd + Shift + Tab - Previous Tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = visibleTabs.findIndex(t => t.id === activeTabId);
        const prevIndex = currentIndex === 0 ? visibleTabs.length - 1 : currentIndex - 1;
        setActiveTabId(visibleTabs[prevIndex].id);
      }
      
      // Ctrl/Cmd + L - Focus Address Bar
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        const addressBar = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (addressBar) {
          addressBar.focus();
          addressBar.select();
        }
      }
      
      // Ctrl/Cmd + F - Find in Page
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindBar(prev => !prev);
      }
      
      // Ctrl/Cmd + Shift + S to open Snapshot Manager
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setIsSnapshotManagerOpen(prev => !prev);
      }
      
      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0' && !isTyping) {
        e.preventDefault();
        handleZoomReset();
      }
      
      // Print shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        const electron = (window as any).electron;
        if (electron?.print?.printPage) {
          electron.print.printPage();
        }
      }
      
      // Developer Tools shortcut (F12)
      if (e.key === 'F12') {
        e.preventDefault();
        const webview = (window as any).__activeWebview;
        if (webview?.openDevTools) {
          webview.openDevTools();
        }
      }
      
      // Inspect element shortcut (Ctrl+Shift+I)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        const webview = (window as any).__activeWebview;
        if (webview?.openDevTools) {
          webview.openDevTools();
        }
      }
      
      // Full screen shortcut (F11)
      if (e.key === 'F11') {
        e.preventDefault();
        const electron = (window as any).electron;
        if (electron?.toggleFullscreen) {
          electron.toggleFullscreen().then((isFullscreen: boolean) => {
            setIsFullScreen(isFullscreen);
          });
        }
      }
      
      // Exit full screen (Escape when in fullscreen)
      if (e.key === 'Escape' && isFullScreen) {
        const electron = (window as any).electron;
        if (electron?.exitFullscreen) {
          electron.exitFullscreen();
          setIsFullScreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, activeTabId, visibleTabs]);

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
        // Use actual search engine based on settings
        const searchUrls: Record<string, string> = {
          'Google': 'https://www.google.com/search?q=',
          'Bing': 'https://www.bing.com/search?q=',
          'DuckDuckGo': 'https://duckduckgo.com/?q='
        };
        const searchBase = searchUrls[settings.searchEngine] || searchUrls.Google;
        url = `${searchBase}${encodeURIComponent(url)}`;
      }
    }

    updateTab(activeTabId, { 
      url, 
      isLoading: true,
      title: url.startsWith('serendib://') ? getInternalTitle(url) : url 
    });

    // For internal pages, stop loading immediately
    if (url.startsWith('serendib://')) {
      setTimeout(() => {
        updateTab(activeTabId, { isLoading: false });
        addToHistory(url);
      }, 100);
    }
    // For external pages, loading state is managed by WebView component
  };

  // Handler for webview title updates
  const handleTabTitleChange = (tabId: string, title: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, title } : t
    ));
  };

  // Handler for webview URL updates
  const handleTabUrlChange = (tabId: string, url: string) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      
      // Add to history if it's a new URL
      if (url !== t.url) {
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        newHistory.push(url);
        return { 
          ...t, 
          url, 
          history: newHistory, 
          historyIndex: newHistory.length - 1 
        };
      }
      return { ...t, url };
    }));
    
    // Add to browser history
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !settings.privacyMode && !url.startsWith('serendib://')) {
      addToHistory(url);
    }
  };

  // Handler for webview loading state
  const handleTabLoadingChange = (tabId: string, isLoading: boolean) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, isLoading } : t
    ));
  };

  // Handler for webview favicon updates
  const handleTabFaviconChange = (tabId: string, favicon: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, favicon } : t
    ));
  };

  // Password form detection handler
  const handlePasswordFormDetected = (url: string, hasCredentials: boolean) => {
    console.log(`[App] Password form detected at ${url}, has credentials: ${hasCredentials}`);
    // Could show autofill icon in address bar or other UI indicator
  };

  // Credential submission handler - shows save password prompt
  const handleCredentialSubmitted = async (url: string, username: string, password: string) => {
    const domain = extractDomain(url);
    if (!domain) return;

    // Check if site is in "never save" list
    if (neverSaveSites.includes(domain)) {
      console.log(`[App] Skipping save prompt for ${domain} (in never-save list)`);
      return;
    }

    // Check if vault is unlocked
    if (!isVaultUnlocked()) {
      console.log('[App] Vault is locked, skipping save prompt');
      return;
    }

    // Check if credential already exists
    const exists = await credentialExists(domain, username);
    
    // Get favicon from current tab
    const favicon = activeTab?.favicon;

    // Show the save password prompt
    setPasswordPrompt({
      isVisible: true,
      domain,
      username,
      password,
      favicon,
      isUpdate: exists,
    });
  };

  // Save password from prompt
  const handleSavePassword = async () => {
    try {
      await saveCredential(
        `https://${passwordPrompt.domain}`,
        passwordPrompt.username,
        passwordPrompt.password
      );
      addNotification('Password Saved', `Credentials for ${passwordPrompt.domain} saved.`, 'success');
    } catch (error) {
      console.error('[App] Failed to save password:', error);
      addNotification('Save Failed', 'Could not save password.', 'error');
    }
    setPasswordPrompt(prev => ({ ...prev, isVisible: false }));
  };

  // Never save for this site
  const handleNeverSavePassword = () => {
    const newList = [...neverSaveSites, passwordPrompt.domain];
    setNeverSaveSites(newList);
    localStorage.setItem('serendib-never-save-passwords', JSON.stringify(newList));
    setPasswordPrompt(prev => ({ ...prev, isVisible: false }));
  };

  // Dismiss prompt without saving
  const handleDismissPasswordPrompt = () => {
    setPasswordPrompt(prev => ({ ...prev, isVisible: false }));
  };

  // --- Zoom Handlers ---
  const ZOOM_PRESETS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0];
  
  const handleTabZoomChange = (tabId: string, zoomFactor: number) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, zoomLevel: zoomFactor } : t
    ));
  };

  const handleZoomIn = () => {
    if ((window as any).__activeWebview?.zoomIn) {
      (window as any).__activeWebview.zoomIn();
    } else if (activeTab) {
      const current = activeTab.zoomLevel || 1.0;
      const nextLevel = ZOOM_PRESETS.find(z => z > current + 0.01) || ZOOM_PRESETS[ZOOM_PRESETS.length - 1];
      handleTabZoomChange(activeTabId, nextLevel);
    }
  };

  const handleZoomOut = () => {
    if ((window as any).__activeWebview?.zoomOut) {
      (window as any).__activeWebview.zoomOut();
    } else if (activeTab) {
      const current = activeTab.zoomLevel || 1.0;
      const prevLevel = [...ZOOM_PRESETS].reverse().find(z => z < current - 0.01) || ZOOM_PRESETS[0];
      handleTabZoomChange(activeTabId, prevLevel);
    }
  };

  const handleZoomReset = () => {
    if ((window as any).__activeWebview?.resetZoom) {
      (window as any).__activeWebview.resetZoom();
    } else if (activeTab) {
      handleTabZoomChange(activeTabId, 1.0);
    }
  };

  const handleSetZoom = (level: number) => {
    if ((window as any).__activeWebview?.setZoomFactor) {
      (window as any).__activeWebview.setZoomFactor(level);
    } else if (activeTab) {
      handleTabZoomChange(activeTabId, level);
    }
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

    // Save to recently closed (unless it's a private tab)
    const container = containers.find(c => c.id === tabToClose.containerId);
    if (!container?.isDisposable && tabToClose.url !== DEFAULT_HOME_URL) {
      setRecentlyClosedTabs(prev => [tabToClose, ...prev.slice(0, 9)]); // Keep last 10
    }

    const remainingTabs = tabs.filter(t => t.id !== id);
    const remainingInWorkspace = remainingTabs.filter(t => t.workspaceId === tabToClose.workspaceId);
    
    const containerId = tabToClose.containerId;
    
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

  // Reopen last closed tab (Ctrl+Shift+T)
  const handleReopenClosedTab = () => {
    if (recentlyClosedTabs.length === 0) {
      addNotification('No Closed Tabs', 'There are no recently closed tabs to reopen.', 'info');
      return;
    }
    
    const [tabToReopen, ...remainingClosed] = recentlyClosedTabs;
    setRecentlyClosedTabs(remainingClosed);
    
    // Create new tab with same URL and title
    const newId = generateId();
    const newTab: Tab = {
      ...tabToReopen,
      id: newId,
      workspaceId: activeWorkspaceId,
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    addNotification('Tab Reopened', `Restored: ${tabToReopen.title}`, 'success');
  };

  // Create private/incognito tab (Ctrl+Shift+N)
  const handleCreatePrivateTab = () => {
    // Add private container if not exists
    if (!containers.find(c => c.id === 'cont-private')) {
      setContainers(prev => [...prev, PRIVATE_CONTAINER]);
    }
    
    const newId = generateId();
    const newTab: Tab = {
      id: newId,
      title: 'Private Tab',
      url: DEFAULT_HOME_URL,
      isLoading: false,
      history: [DEFAULT_HOME_URL],
      historyIndex: 0,
      workspaceId: activeWorkspaceId,
      containerId: 'cont-private',
      isPrivate: true,
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setIsPrivateMode(true);
    addNotification('Private Browsing', 'This tab won\'t save history, cookies, or cache.', 'info');
  };

  // --- Pin/Mute Tab Handlers ---
  const handleTogglePinTab = (tabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, isPinned: !t.isPinned } : t
    ));
  };

  const handleToggleMuteTab = (tabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, isMuted: !t.isMuted } : t
    ));
    // Also mute the webview audio if in Electron
    // This would require additional webview integration
  };

  // --- Permission Handlers ---
  const handleUpdatePermission = (origin: string, permission: PermissionType, setting: PermissionSetting) => {
    setSitePermissionsMap(prev => {
      const existing = prev[origin] || { origin, permissions: {}, lastModified: Date.now() };
      const updated = {
        ...existing,
        permissions: { ...existing.permissions, [permission]: setting },
        lastModified: Date.now(),
      };
      const newMap = { ...prev, [origin]: updated };
      localStorage.setItem('serendib-site-permissions', JSON.stringify(newMap));
      return newMap;
    });
    addNotification('Permission Updated', `${permission} set to ${setting} for ${new URL(origin).hostname}`, 'info');
  };

  const handleResetSitePermissions = (origin: string) => {
    setSitePermissionsMap(prev => {
      const { [origin]: removed, ...rest } = prev;
      localStorage.setItem('serendib-site-permissions', JSON.stringify(rest));
      return rest;
    });
    addNotification('Permissions Reset', `Custom permissions removed for ${new URL(origin).hostname}`, 'info');
  };

  const handleClearAllSitePermissions = () => {
    setSitePermissionsMap({});
    localStorage.removeItem('serendib-site-permissions');
    addNotification('All Permissions Cleared', 'All site-specific permissions have been reset', 'info');
  };

  // Note: Default permissions are stored as a constant and don't need a setter
  // For changing defaults, we would need to add it to settings

  // Get permissions for current tab's origin
  const getCurrentSitePermissions = (): SitePermissions | undefined => {
    if (!activeTab?.url.startsWith('http')) return undefined;
    try {
      const origin = new URL(activeTab.url).origin;
      return sitePermissionsMap[origin];
    } catch {
      return undefined;
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

  const handleSaveOffline = async () => {
    if (!activeTab || activeTab.url.startsWith('serendib://')) return;
    if (isCurrentPageSaved) return;

    updateTab(activeTabId, { isLoading: true });

    try {
      // Check if we're in Electron environment
      const electron = (window as any).electron;
      
      if (electron?.offline?.fetchPage) {
        // Fetch page content via Electron
        const result = await electron.offline.fetchPage(activeTab.url);
        
        if (result.success && result.html) {
          // Use the offline service to extract and create the page
          const { createOfflinePageFromHtml, saveOfflinePage } = await import('./src/services/offline');
          
          const page = createOfflinePageFromHtml(activeTab.url, result.html, {
            useReaderMode: true,
            includeImages: false, // Can be enabled later
          });
          
          // Override title with the tab title if available
          if (activeTab.title && activeTab.title !== 'New Tab') {
            page.title = activeTab.title;
          }
          
          // Add favicon if available
          if (activeTab.favicon) {
            page.favicon = activeTab.favicon;
          }
          
          // Save to localStorage
          saveOfflinePage(page);
          
          // Also save HTML content to file system for larger content
          await electron.offline.savePage(page.id, page.content);
          
          setOfflinePages(prev => [page, ...prev.filter(p => p.url !== page.url)]);
          addNotification('Page Saved', `"${page.title}" is now available offline.`, 'success');
        } else {
          throw new Error(result.error || 'Failed to fetch page');
        }
      } else {
        // Fallback for non-Electron environment (demo mode)
        const newPage: OfflinePage = {
          id: generateId(),
          title: activeTab.title,
          url: activeTab.url,
          excerpt: `Saved version of ${activeTab.title}.`,
          content: `<article class="prose dark:prose-invert max-w-none"><h1 class="text-4xl font-bold mb-4">${activeTab.title}</h1><p>This page was saved for offline reading. In the full Electron app, the complete article content would be extracted and displayed here.</p></article>`,
          savedAt: Date.now(),
          synced: false,
          size: '0.1 MB',
          favicon: activeTab.favicon,
          siteName: new URL(activeTab.url).hostname,
          readingTime: 1,
          wordCount: 50,
          syncStatus: 'local-only',
        };
        
        setOfflinePages(prev => [newPage, ...prev]);
        addNotification('Page Saved (Demo)', 'Content available in offline reading list.', 'success');
      }
    } catch (error) {
      console.error('Failed to save offline:', error);
      addNotification('Save Failed', 'Could not save page for offline reading.', 'error');
    } finally {
      updateTab(activeTabId, { isLoading: false });
    }
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
    // First try to use the webview's back navigation
    if ((window as any).__activeWebview?.canGoBack?.()) {
      (window as any).__activeWebview.goBack();
      return;
    }
    
    // Fallback to internal history
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const newIndex = activeTab.historyIndex - 1;
    const prevUrl = activeTab.history[newIndex];
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, historyIndex: newIndex, url: prevUrl, title: prevUrl.startsWith('serendib://') ? getInternalTitle(prevUrl) : prevUrl } : t));
  };

  const handleForward = () => {
    // First try to use the webview's forward navigation
    if ((window as any).__activeWebview?.canGoForward?.()) {
      (window as any).__activeWebview.goForward();
      return;
    }
    
    // Fallback to internal history
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const newIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[newIndex];
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, historyIndex: newIndex, url: nextUrl, title: nextUrl.startsWith('serendib://') ? getInternalTitle(nextUrl) : nextUrl } : t));
  };

  const handleRefresh = () => {
    // Try to use the webview's reload
    if ((window as any).__activeWebview?.reload) {
      (window as any).__activeWebview.reload();
      return;
    }
    
    // Fallback to navigating to the same URL
    handleNavigate(activeTab?.url || DEFAULT_HOME_URL);
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

  // --- Snapshot Restore Handler ---
  const handleRestoreSnapshot = (snapshot: WorkspaceSnapshot, options: SnapshotImportOptions) => {
    const mergeMode = options.mergeMode || 'merge';
    
    // Convert snapshot data to regular types
    const newTabs = snapshotTabsToTabs(snapshot.tabs);
    const newWorkspaces = snapshotWorkspacesToWorkspaces(snapshot.workspaces);
    
    // Handle containers if present
    if (snapshot.containers) {
      const newContainers = snapshotContainersToContainers(snapshot.containers);
      if (mergeMode === 'replace') {
        // Keep default container, add new ones
        setContainers([containers[0], ...newContainers.filter(c => c.id !== 'cont-default')]);
      } else {
        // Merge: add containers that don't exist
        setContainers(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const toAdd = newContainers.filter(c => !existingIds.has(c.id));
          return [...prev, ...toAdd];
        });
      }
    }
    
    // Handle workspaces
    if (mergeMode === 'replace') {
      setWorkspaces(newWorkspaces);
    } else {
      // Merge: add workspaces with new IDs
      setWorkspaces(prev => [...prev, ...newWorkspaces]);
    }
    
    // Handle tabs
    if (mergeMode === 'replace') {
      setTabs(newTabs);
      if (newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
        setActiveWorkspaceId(newTabs[0].workspaceId);
      }
    } else {
      // Merge: add tabs to current workspace
      const mappedTabs = newTabs.map(t => ({
        ...t,
        workspaceId: activeWorkspaceId
      }));
      setTabs(prev => [...prev, ...mappedTabs]);
    }
    
    // Handle bookmarks if present
    if (snapshot.bookmarks) {
      if (mergeMode === 'replace') {
        setBookmarks(snapshot.bookmarks);
      } else {
        // Merge: add bookmarks that don't exist (by URL)
        setBookmarks(prev => {
          const existingUrls = new Set(prev.map(b => b.url));
          const toAdd = snapshot.bookmarks!.filter(b => !existingUrls.has(b.url));
          return [...prev, ...toAdd];
        });
      }
    }
    
    // Handle settings if present
    if (snapshot.settings) {
      setSettings(prev => ({
        ...prev,
        ...snapshot.settings
      }));
    }
  };

  // --- Split View Toggle ---
  const handleToggleSplitView = () => {
    if (splitView.enabled) {
      // Exit split view
      setSplitView({
        enabled: false,
        leftTabId: null,
        rightTabId: null,
        splitRatio: 0.5,
      });
    } else {
      // Enter split view - use current tab as left, need to select right tab
      // For now, use the next tab or create one if none available
      const currentIndex = visibleTabs.findIndex(t => t.id === activeTabId);
      const rightTab = visibleTabs.find((t, i) => i !== currentIndex && t.id !== activeTabId);
      
      if (rightTab) {
        setSplitView({
          enabled: true,
          leftTabId: activeTabId,
          rightTabId: rightTab.id,
          splitRatio: 0.5,
        });
      } else if (visibleTabs.length >= 1) {
        // Only one tab, create a new one for right side
        const newId = generateId();
        const newTab: Tab = {
          id: newId,
          title: 'New Tab',
          url: DEFAULT_HOME_URL,
          isLoading: false,
          history: [DEFAULT_HOME_URL],
          historyIndex: 0,
          workspaceId: activeWorkspaceId,
          containerId: 'cont-default'
        };
        setTabs(prev => [...prev, newTab]);
        setSplitView({
          enabled: true,
          leftTabId: activeTabId,
          rightTabId: newId,
          splitRatio: 0.5,
        });
      }
    }
  };

  const handleCloseSplitView = () => {
    setSplitView({
      enabled: false,
      leftTabId: null,
      rightTabId: null,
      splitRatio: 0.5,
    });
  };

  const showVerticalTabs = !isFocusMode && settings.verticalTabs;
  const showHorizontalTabs = !isFocusMode && !settings.verticalTabs;

  return (
    <div className="flex h-screen w-screen overflow-hidden text-sm bg-[#050505] text-zinc-100 font-sans selection:bg-zinc-800">
      
      {/* Window Title Bar with Drag Region */}
      <div className="absolute top-0 left-0 right-0 h-8 drag-region z-50 flex items-center justify-end">
        <WindowControls className="no-drag" />
      </div>

      {/* 1. Sidebar (Vertical Tabs) */}
      {showVerticalTabs && (
        <div className="pt-8">
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
          onTogglePinTab={handleTogglePinTab}
          onToggleMuteTab={handleToggleMuteTab}
        />
        </div>
      )}

      {/* 2. Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505] relative pt-8">
        
        {/* Horizontal Tab Strip */}
        {showHorizontalTabs && (
          <HorizontalTabBar
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
            onReorderTabs={handleReorderTabs}
            onMoveTabToWorkspace={handleMoveTabToWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            onChangeTabContainer={handleSwitchContainer}
            onCreateDisposableTab={handleCreateDisposableTab}
            onTogglePinTab={handleTogglePinTab}
            onToggleMuteTab={handleToggleMuteTab}
          />
        )}

        {/* OmniBox */}
        {!isFocusMode && (
          <OmniBox 
            url={activeTab?.url || ''}
            title={activeTab?.title || ''}
            isLoading={activeTab?.isLoading || false}
            activeContainer={activeContainer}
            containers={containers}
            onNavigate={handleNavigate}
            onRefresh={handleRefresh}
            onBack={handleBack}
            onForward={handleForward}
            onNewTab={handleCreateTab}
            onNewTabInContainer={handleCreateTab}
            onNewDisposableTab={handleCreateDisposableTab}
            onNewPrivateTab={handleCreatePrivateTab}
            onReopenClosedTab={handleReopenClosedTab}
            onToggleAI={() => setIsAiOpen(!isAiOpen)}
            isAiOpen={isAiOpen}
            isBookmarked={!!bookmarks.find(b => b.url === activeTab?.url)}
            onToggleBookmark={toggleBookmark}
            onToggleFocus={() => setIsFocusMode(true)}
            onSaveOffline={handleSaveOffline}
            isOfflineSaved={isCurrentPageSaved}
            onOpenSnapshots={() => setIsSnapshotManagerOpen(true)}
            // Autocomplete data
            history={history}
            bookmarks={bookmarks}
            // Zoom
            zoomLevel={activeTab?.zoomLevel || 1.0}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onSetZoom={handleSetZoom}
            sitePermissions={getCurrentSitePermissions()}
            defaultPermissions={DEFAULT_PERMISSIONS}
            onUpdatePermission={handleUpdatePermission}
            onResetSitePermissions={handleResetSitePermissions}
            onToggleSplitView={handleToggleSplitView}
            isSplitView={splitView.enabled}
            // Private mode
            isPrivateMode={activeTab?.isPrivate || false}
          />
        )}        <div className="flex-1 flex overflow-hidden relative">
          {/* Split View Mode */}
          {splitView.enabled && splitView.leftTabId && splitView.rightTabId ? (
            <SplitViewContainer
              tabs={visibleTabs}
              leftTabId={splitView.leftTabId}
              rightTabId={splitView.rightTabId}
              containers={containers}
              onTabTitleChange={handleTabTitleChange}
              onTabUrlChange={handleTabUrlChange}
              onTabLoadingChange={handleTabLoadingChange}
              onTabFaviconChange={handleTabFaviconChange}
              onCloseSplitView={handleCloseSplitView}
            />
          ) : (
            <ContentFrame 
              activeTab={activeTab}
              tabs={visibleTabs}
              containers={containers}
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
              onTabTitleChange={handleTabTitleChange}
              onTabUrlChange={handleTabUrlChange}
              onTabLoadingChange={handleTabLoadingChange}
              onTabFaviconChange={handleTabFaviconChange}
              onPasswordFormDetected={handlePasswordFormDetected}
              onCredentialSubmitted={handleCredentialSubmitted}
              onTabZoomChange={handleTabZoomChange}
              sitePermissionsMap={sitePermissionsMap}
              defaultPermissions={DEFAULT_PERMISSIONS}
              onResetSitePermissions={handleResetSitePermissions}
              onClearAllSitePermissions={handleClearAllSitePermissions}
            />
          )}
          
          <AIPanel 
            isOpen={isAiOpen} 
            onClose={() => setIsAiOpen(false)}
            currentUrl={activeTab?.url || ''}
          />

          <ToastContainer 
            notifications={notifications} 
            onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
          />

          {/* Save Password Prompt */}
          <SavePasswordPrompt
            isVisible={passwordPrompt.isVisible}
            domain={passwordPrompt.domain}
            username={passwordPrompt.username}
            password={passwordPrompt.password}
            favicon={passwordPrompt.favicon}
            isUpdate={passwordPrompt.isUpdate}
            onSave={handleSavePassword}
            onNeverSave={handleNeverSavePassword}
            onDismiss={handleDismissPasswordPrompt}
          />

          {/* Snapshot Manager Modal */}
          <SnapshotManager
            isOpen={isSnapshotManagerOpen}
            onClose={() => setIsSnapshotManagerOpen(false)}
            tabs={tabs}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            activeTabId={activeTabId}
            containers={containers}
            bookmarks={bookmarks}
            settings={settings}
            onRestoreSnapshot={handleRestoreSnapshot}
            onNotification={addNotification}
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