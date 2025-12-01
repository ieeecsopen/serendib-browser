// Type declarations for Electron preload API

export interface SnapshotFileInfo {
  filename: string;
  filePath: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
}

export interface SnapshotAPI {
  saveToFile: (filename: string, content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  loadFromFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  listFiles: () => Promise<{ success: boolean; snapshots: SnapshotFileInfo[]; error?: string }>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  exportWithDialog: (defaultFilename: string, content: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  importWithDialog: () => Promise<{ success: boolean; filePath?: string; content?: string; canceled?: boolean; error?: string }>;
  getDir: () => Promise<string>;
  openFolder: () => Promise<{ success: boolean }>;
}

export interface OfflineAPI {
  fetchPage: (url: string) => Promise<{ success: boolean; html?: string; contentType?: string; url?: string; error?: string }>;
  fetchImage: (imageUrl: string, pageId: string) => Promise<{ success: boolean; localPath?: string; filename?: string; size?: number; originalUrl?: string; error?: string }>;
  savePage: (pageId: string, content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  loadPage: (pageId: string) => Promise<{ success: boolean; content?: string; notFound?: boolean; error?: string }>;
  deletePage: (pageId: string) => Promise<{ success: boolean; error?: string }>;
  getStats: () => Promise<{ success: boolean; pageCount?: number; imageCount?: number; totalSize?: number; offlineDir?: string; imagesDir?: string; error?: string }>;
  openFolder: () => Promise<{ success: boolean }>;
  getImageData: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
}

export interface ContainerAPI {
  getPartition: (containerId: string, isDisposable?: boolean) => Promise<string>;
  clear: (containerId: string) => Promise<{ success: boolean; error?: string }>;
  destroy: (containerId: string) => Promise<{ success: boolean; error?: string }>;
  getStats: (containerId: string) => Promise<{ 
    containerId: string; 
    isDisposable: boolean; 
    cookieCount: number; 
    cacheSize: number; 
    cacheSizeFormatted: string 
  } | null>;
  listActive: () => Promise<{ id: string; partition: string; isDisposable: boolean }[]>;
  clearAllDisposable: () => Promise<{ containerId: string; success: boolean; error?: string }[]>;
  getCookies: (containerId: string, filter?: object) => Promise<{ success: boolean; cookies?: any[]; error?: string }>;
  removeCookie: (containerId: string, url: string, name: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  platform: string;
  
  // Browser navigation
  navigateTo: (url: string) => Promise<{ success: boolean; url: string }>;
  getPageInfo: (webContentsId: number) => Promise<{
    title: string;
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
  } | null>;
  downloadUrl: (url: string) => Promise<void>;
  
  // Container session management (modern API)
  container: ContainerAPI;
  
  // Container session management (legacy)
  getContainerSession: (containerId: string) => Promise<string>;
  clearContainerSession: (containerId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Snapshot file operations
  snapshot: SnapshotAPI;
  
  // Offline page operations
  offline: OfflineAPI;
  
  // IPC communication
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, func: (...args: unknown[]) => void) => void;
  invoke: (channel: string, data?: unknown) => Promise<unknown>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// Electron webview types
declare namespace Electron {
  interface WebviewTag extends HTMLElement {
    src: string;
    preload?: string;
    partition?: string;
    allowpopups?: string;
    webpreferences?: string;
    
    loadURL(url: string): Promise<void>;
    reload(): void;
    stop(): void;
    goBack(): void;
    goForward(): void;
    canGoBack(): boolean;
    canGoForward(): boolean;
    getURL(): string;
    getTitle(): string;
    isLoading(): boolean;
    
    addEventListener<K extends keyof WebviewTagEventMap>(
      type: K,
      listener: (ev: WebviewTagEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof WebviewTagEventMap>(
      type: K,
      listener: (ev: WebviewTagEventMap[K]) => void,
      options?: boolean | EventListenerOptions
    ): void;
  }

  interface WebviewTagEventMap {
    'dom-ready': Event;
    'did-start-loading': Event;
    'did-stop-loading': Event;
    'did-finish-load': Event;
    'did-fail-load': DidFailLoadEvent;
    'did-navigate': DidNavigateEvent;
    'did-navigate-in-page': DidNavigateInPageEvent;
    'page-title-updated': PageTitleUpdatedEvent;
    'page-favicon-updated': PageFaviconUpdatedEvent;
    'new-window': NewWindowEvent;
    'console-message': ConsoleMessageEvent;
  }

  interface DidFailLoadEvent extends Event {
    errorCode: number;
    errorDescription: string;
    validatedURL: string;
    isMainFrame: boolean;
  }

  interface DidNavigateEvent extends Event {
    url: string;
  }

  interface DidNavigateInPageEvent extends Event {
    url: string;
    isMainFrame: boolean;
  }

  interface PageTitleUpdatedEvent extends Event {
    title: string;
    explicitSet: boolean;
  }

  interface PageFaviconUpdatedEvent extends Event {
    favicons: string[];
  }

  interface NewWindowEvent extends Event {
    url: string;
    frameName: string;
    disposition: string;
  }

  interface ConsoleMessageEvent extends Event {
    level: number;
    message: string;
    line: number;
    sourceId: string;
  }
}

export {};
