// Type declarations for Electron preload API
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
  
  // Container session management
  getContainerSession: (containerId: string) => Promise<string>;
  clearContainerSession: (containerId: string) => Promise<{ success: boolean; error?: string }>;
  
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
