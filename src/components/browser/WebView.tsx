/**
 * WebView Component
 * 
 * Electron webview wrapper for rendering external web pages.
 * Handles navigation, events, error states, container session isolation,
 * and password autofill integration.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Tab, Container } from '../../types';
import type { AutofillSuggestion } from '../../types/passwords';
import { getAutofillScript, getAutofillFillScript, getSuggestionsForUrl } from '../../services/autofill';
import { decryptPassword, extractDomain, isVaultUnlocked } from '../../services/passwords';

// ============================================================================
// Types
// ============================================================================

interface WebViewEvent extends Event {
  url?: string;
  title?: string;
  favicons?: string[];
  errorCode?: number;
  errorDescription?: string;
  isMainFrame?: boolean;
  level?: number;
  message?: string;
}

interface WebViewProps {
  tab: Tab;
  isActive: boolean;
  container?: Container;
  onTitleChange: (tabId: string, title: string) => void;
  onUrlChange: (tabId: string, url: string) => void;
  onLoadingChange: (tabId: string, isLoading: boolean) => void;
  onFaviconChange: (tabId: string, favicon: string) => void;
  onNavigate: (url: string) => void;
  onPasswordFormDetected?: (url: string, hasCredentials: boolean) => void;
  onCredentialSubmitted?: (url: string, username: string, password: string) => void;
  onZoomChange?: (tabId: string, zoomFactor: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ABORTED_ERROR_CODE = -3;

// Zoom presets and limits
const ZOOM_PRESETS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0];
const MIN_ZOOM = ZOOM_PRESETS[0];
const MAX_ZOOM = ZOOM_PRESETS[ZOOM_PRESETS.length - 1];

// ============================================================================
// Global WebView Interface
// ============================================================================

export interface ActiveWebview {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  loadURL: (url: string) => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  fillCredentials?: (username: string, password: string) => Promise<boolean>;
  // Zoom methods
  getZoomFactor?: () => number;
  setZoomFactor?: (factor: number) => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
  // DevTools methods
  openDevTools?: () => void;
  closeDevTools?: () => void;
  isDevToolsOpened?: () => boolean;
}

declare global {
  interface Window {
    __activeWebview?: ActiveWebview;
    electron?: {
      minimize?: () => void;
      maximize?: () => Promise<void>;
      close?: () => void;
      isMaximized?: () => Promise<boolean>;
      container?: {
        getPartition: (containerId: string, isDisposable: boolean) => Promise<string>;
        clear: (containerId: string) => Promise<{ success: boolean }>;
        destroy: (containerId: string) => Promise<{ success: boolean }>;
        getStats: (containerId: string) => Promise<any>;
        listActive: () => Promise<{ containers: string[]; disposableCount: number }>;
        clearAllDisposable: () => Promise<{ clearedCount: number }>;
        getCookies: (containerId: string, filter?: any) => Promise<any[]>;
        removeCookie: (containerId: string, url: string, name: string) => Promise<void>;
      };
    };
  }
}

// ============================================================================
// Main Component
// ============================================================================

export const WebView: React.FC<WebViewProps> = ({
  tab,
  isActive,
  container,
  onTitleChange,
  onUrlChange,
  onLoadingChange,
  onFaviconChange,
  onNavigate,
  onPasswordFormDetected,
  onCredentialSubmitted,
  onZoomChange,
}) => {
  const webviewRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partition, setPartition] = useState<string | null>(null);
  const [autofillInjected, setAutofillInjected] = useState(false);

  // Get container partition on mount or when container changes
  useEffect(() => {
    const initPartition = async () => {
      if (window.electron?.container && tab.containerId) {
        try {
          const isDisposable = container?.isDisposable || tab.containerId.includes('disp');
          const partitionStr = await window.electron.container.getPartition(
            tab.containerId, 
            isDisposable
          );
          setPartition(partitionStr);
          console.log(`[WebView] Using partition: ${partitionStr} for tab: ${tab.id}`);
        } catch (err) {
          console.error('[WebView] Failed to get partition:', err);
          // Fallback to default partition
          setPartition(null);
        }
      }
    };
    
    initPartition();
  }, [tab.containerId, container?.isDisposable]);

  // Inject autofill script when DOM is ready
  const injectAutofillScript = useCallback(async () => {
    const webview = webviewRef.current as any;
    if (!webview || autofillInjected) return;

    try {
      // Inject the form detection script
      await webview.executeJavaScript(getAutofillScript());
      setAutofillInjected(true);
      console.log('[WebView] Autofill script injected');

      // Check for password fields and get suggestions
      const hasPasswordField = await webview.executeJavaScript(`
        (function() {
          return typeof window.__serendibHasPasswordField === 'function' 
            ? window.__serendibHasPasswordField() 
            : document.querySelector('input[type="password"]') !== null;
        })();
      `);

      if (hasPasswordField) {
        const currentUrl = tab.url;
        const suggestions = await getSuggestionsForUrl(currentUrl);
        const hasCredentials = suggestions.length > 0;
        
        console.log(`[WebView] Password form detected, ${suggestions.length} credentials available`);
        onPasswordFormDetected?.(currentUrl, hasCredentials);

        // Set up form submission listener
        await webview.executeJavaScript(`
          (function() {
            if (typeof window.__serendibCaptureSubmission === 'function') {
              window.__serendibCaptureSubmission(function(data) {
                // Send message to parent via console (will be captured)
                console.log('__SERENDIB_CREDENTIAL_SUBMIT__' + JSON.stringify(data));
              });
            }
          })();
        `);
      }
    } catch (err) {
      console.error('[WebView] Failed to inject autofill script:', err);
    }
  }, [tab.url, autofillInjected, onPasswordFormDetected]);

  // Fill credentials method (exposed globally for the tab)
  const fillCredentials = useCallback(async (username: string, password: string) => {
    const webview = webviewRef.current as any;
    if (!webview) return false;

    try {
      const result = await webview.executeJavaScript(getAutofillFillScript(username, password));
      console.log('[WebView] Credentials filled:', result);
      return result;
    } catch (err) {
      console.error('[WebView] Failed to fill credentials:', err);
      return false;
    }
  }, []);

  // Zoom methods
  const getZoomFactor = useCallback(() => {
    const webview = webviewRef.current as any;
    return webview?.getZoomFactor?.() || 1.0;
  }, []);

  const setZoomFactor = useCallback((factor: number) => {
    const webview = webviewRef.current as any;
    if (!webview) return;
    
    const clampedFactor = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, factor));
    webview.setZoomFactor(clampedFactor);
    onZoomChange?.(tab.id, clampedFactor);
  }, [tab.id, onZoomChange]);

  const zoomIn = useCallback(() => {
    const current = getZoomFactor();
    // Find next zoom level
    const nextLevel = ZOOM_PRESETS.find(z => z > current + 0.01) || MAX_ZOOM;
    setZoomFactor(nextLevel);
  }, [getZoomFactor, setZoomFactor]);

  const zoomOut = useCallback(() => {
    const current = getZoomFactor();
    // Find previous zoom level
    const prevLevel = [...ZOOM_PRESETS].reverse().find(z => z < current - 0.01) || MIN_ZOOM;
    setZoomFactor(prevLevel);
  }, [getZoomFactor, setZoomFactor]);

  const resetZoom = useCallback(() => {
    setZoomFactor(1.0);
  }, [setZoomFactor]);

  // Event Handlers
  useEffect(() => {
    const webview = webviewRef.current as any;
    if (!webview) return;

    const handlers = {
      'dom-ready': () => {
        setIsReady(true);
        setError(null);
        // Inject autofill script when DOM is ready
        injectAutofillScript();
      },
      'did-start-loading': () => {
        onLoadingChange(tab.id, true);
        setError(null);
        setAutofillInjected(false); // Reset for new page
      },
      'did-stop-loading': () => {
        onLoadingChange(tab.id, false);
      },
      'did-finish-load': () => {
        onLoadingChange(tab.id, false);
        // Re-inject autofill script after page load
        if (!autofillInjected) {
          injectAutofillScript();
        }
      },
      'page-title-updated': (e: WebViewEvent) => {
        if (e.title) onTitleChange(tab.id, e.title);
      },
      'did-navigate': (e: WebViewEvent) => {
        if (e.url) onUrlChange(tab.id, e.url);
      },
      'did-navigate-in-page': (e: WebViewEvent) => {
        if (e.isMainFrame && e.url) onUrlChange(tab.id, e.url);
      },
      'page-favicon-updated': (e: WebViewEvent) => {
        if (e.favicons?.[0]) onFaviconChange(tab.id, e.favicons[0]);
      },
      'did-fail-load': (e: WebViewEvent) => {
        if (e.errorCode !== ABORTED_ERROR_CODE) {
          setError(e.errorDescription || 'Failed to load page');
          onLoadingChange(tab.id, false);
        }
      },
      'new-window': (e: WebViewEvent) => {
        e.preventDefault();
        if (e.url) onNavigate(e.url);
      },
      'console-message': (e: WebViewEvent) => {
        if (e.level === 2) console.error('[WebView Console]', e.message);
        
        // Capture credential submission messages
        if (e.message?.startsWith('__SERENDIB_CREDENTIAL_SUBMIT__')) {
          try {
            const jsonStr = e.message.replace('__SERENDIB_CREDENTIAL_SUBMIT__', '');
            const data = JSON.parse(jsonStr);
            if (data.username && data.password) {
              console.log('[WebView] Credential submitted:', data.username);
              onCredentialSubmitted?.(data.url || tab.url, data.username, data.password);
            }
          } catch (err) {
            console.error('[WebView] Failed to parse credential submission:', err);
          }
        }
      },
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      webview.addEventListener(event, handler);
    });

    // Cleanup
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        webview.removeEventListener(event, handler);
      });
    };
  }, [tab.id, tab.url, autofillInjected, injectAutofillScript, onTitleChange, onUrlChange, onLoadingChange, onFaviconChange, onNavigate, onCredentialSubmitted]);

  // Navigation Methods
  const goBack = useCallback(() => {
    const webview = webviewRef.current as any;
    if (webview?.canGoBack?.()) webview.goBack();
  }, []);

  const goForward = useCallback(() => {
    const webview = webviewRef.current as any;
    if (webview?.canGoForward?.()) webview.goForward();
  }, []);

  const reload = useCallback(() => {
    const webview = webviewRef.current as any;
    webview?.reload?.();
  }, []);

  const stop = useCallback(() => {
    const webview = webviewRef.current as any;
    webview?.stop?.();
  }, []);

  const loadURL = useCallback((url: string) => {
    const webview = webviewRef.current as any;
    webview?.loadURL?.(url);
  }, []);

  // Expose active webview methods globally
  useEffect(() => {
    const webview = webviewRef.current as any;
    if (isActive && webview) {
      window.__activeWebview = {
        goBack,
        goForward,
        reload,
        stop,
        loadURL,
        canGoBack: () => webview?.canGoBack?.() || false,
        canGoForward: () => webview?.canGoForward?.() || false,
        fillCredentials,
        // Zoom methods
        getZoomFactor,
        setZoomFactor,
        zoomIn,
        zoomOut,
        resetZoom,
      };
    }
  }, [isActive, goBack, goForward, reload, stop, loadURL, fillCredentials, getZoomFactor, setZoomFactor, zoomIn, zoomOut, resetZoom]);

  // Don't render for internal URLs
  if (tab.url.startsWith('serendib://')) {
    return null;
  }

  // Error State
  if (error) {
    return (
      <WebViewError
        error={error}
        isActive={isActive}
        onRetry={() => {
          setError(null);
          const webview = webviewRef.current as any;
          webview?.reload?.();
        }}
        onGoHome={() => onNavigate('serendib://newtab')}
      />
    );
  }

  // Build webview props with optional partition
  const webviewProps: Record<string, any> = {
    ref: webviewRef,
    src: tab.url,
    className: `absolute inset-0 w-full h-full ${isActive ? '' : 'hidden'}`,
    style: { display: isActive ? 'flex' : 'none' },
    allowpopups: 'true',
    useragent: USER_AGENT,
    webpreferences: 'contextIsolation=yes, nodeIntegration=no',
  };

  // Add partition if available (for container isolation)
  if (partition) {
    webviewProps.partition = partition;
  }

  return React.createElement('webview', webviewProps);
};

// ============================================================================
// Error Component
// ============================================================================

interface WebViewErrorProps {
  error: string;
  isActive: boolean;
  onRetry: () => void;
  onGoHome: () => void;
}

const WebViewError: React.FC<WebViewErrorProps> = ({ error, isActive, onRetry, onGoHome }) => (
  <div
    className={`absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-center p-8 ${
      isActive ? '' : 'hidden'
    }`}
  >
    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
      <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    <h2 className="text-xl font-medium text-white mb-2">Can't reach this page</h2>
    <p className="text-zinc-500 text-sm mb-6 max-w-md">{error}</p>
    <div className="flex gap-3">
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
      >
        Try again
      </button>
      <button
        onClick={onGoHome}
        className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
      >
        Go home
      </button>
    </div>
  </div>
);

export default WebView;
