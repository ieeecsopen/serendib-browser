import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Tab } from '../types';

interface WebViewProps {
  tab: Tab;
  isActive: boolean;
  onTitleChange: (tabId: string, title: string) => void;
  onUrlChange: (tabId: string, url: string) => void;
  onLoadingChange: (tabId: string, isLoading: boolean) => void;
  onFaviconChange: (tabId: string, favicon: string) => void;
  onNavigate: (url: string) => void;
}

export const WebView: React.FC<WebViewProps> = ({
  tab,
  isActive,
  onTitleChange,
  onUrlChange,
  onLoadingChange,
  onFaviconChange,
  onNavigate,
}) => {
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle webview events
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = () => {
      setIsReady(true);
      setError(null);
    };

    const handleDidStartLoading = () => {
      onLoadingChange(tab.id, true);
      setError(null);
    };

    const handleDidStopLoading = () => {
      onLoadingChange(tab.id, false);
    };

    const handleDidFinishLoad = () => {
      onLoadingChange(tab.id, false);
    };

    const handlePageTitleUpdated = (e: Electron.PageTitleUpdatedEvent) => {
      onTitleChange(tab.id, e.title);
    };

    const handleDidNavigate = (e: Electron.DidNavigateEvent) => {
      onUrlChange(tab.id, e.url);
    };

    const handleDidNavigateInPage = (e: Electron.DidNavigateInPageEvent) => {
      if (e.isMainFrame) {
        onUrlChange(tab.id, e.url);
      }
    };

    const handlePageFaviconUpdated = (e: Electron.PageFaviconUpdatedEvent) => {
      if (e.favicons && e.favicons.length > 0) {
        onFaviconChange(tab.id, e.favicons[0]);
      }
    };

    const handleDidFailLoad = (e: Electron.DidFailLoadEvent) => {
      if (e.errorCode !== -3) { // -3 is aborted, ignore it
        setError(e.errorDescription || 'Failed to load page');
        onLoadingChange(tab.id, false);
      }
    };

    const handleNewWindow = (e: Electron.NewWindowEvent) => {
      e.preventDefault();
      // Open in same browser instead of new window
      onNavigate(e.url);
    };

    const handleConsoleMessage = (e: Electron.ConsoleMessageEvent) => {
      // Optionally log console messages for debugging
      if (e.level === 2) { // Error level
        console.error('[WebView Console]', e.message);
      }
    };

    // Add event listeners
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('page-title-updated', handlePageTitleUpdated);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    webview.addEventListener('page-favicon-updated', handlePageFaviconUpdated);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('new-window', handleNewWindow);
    webview.addEventListener('console-message', handleConsoleMessage);

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
      webview.removeEventListener('did-stop-loading', handleDidStopLoading);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
      webview.removeEventListener('page-favicon-updated', handlePageFaviconUpdated);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('new-window', handleNewWindow);
      webview.removeEventListener('console-message', handleConsoleMessage);
    };
  }, [tab.id, onTitleChange, onUrlChange, onLoadingChange, onFaviconChange, onNavigate]);

  // Navigation methods exposed via ref
  const goBack = useCallback(() => {
    if (webviewRef.current?.canGoBack()) {
      webviewRef.current.goBack();
    }
  }, []);

  const goForward = useCallback(() => {
    if (webviewRef.current?.canGoForward()) {
      webviewRef.current.goForward();
    }
  }, []);

  const reload = useCallback(() => {
    webviewRef.current?.reload();
  }, []);

  const stop = useCallback(() => {
    webviewRef.current?.stop();
  }, []);

  const loadURL = useCallback((url: string) => {
    if (webviewRef.current) {
      webviewRef.current.loadURL(url);
    }
  }, []);

  // Expose methods to parent via window object for this tab
  useEffect(() => {
    if (isActive && webviewRef.current) {
      (window as any).__activeWebview = {
        goBack,
        goForward,
        reload,
        stop,
        loadURL,
        canGoBack: () => webviewRef.current?.canGoBack() || false,
        canGoForward: () => webviewRef.current?.canGoForward() || false,
      };
    }
  }, [isActive, goBack, goForward, reload, stop, loadURL]);

  // Don't render webview for internal URLs
  if (tab.url.startsWith('serendib://')) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-center p-8 ${isActive ? '' : 'hidden'}`}
      >
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Can't reach this page</h2>
        <p className="text-zinc-500 text-sm mb-6 max-w-md">{error}</p>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setError(null);
              webviewRef.current?.reload();
            }}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Try again
          </button>
          <button 
            onClick={() => onNavigate('serendib://newtab')}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <webview
      ref={webviewRef}
      src={tab.url}
      className={`absolute inset-0 w-full h-full ${isActive ? '' : 'hidden'}`}
      style={{ display: isActive ? 'flex' : 'none' }}
      allowpopups="true"
      webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes"
    />
  );
};

export default WebView;
