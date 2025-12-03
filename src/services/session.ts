/**
 * Session Restore Service
 * 
 * Handles saving and restoring browser sessions for crash recovery
 * and session continuity.
 */

import type { Tab, Workspace, Container } from '../types/browser';
import type { BrowserSettings } from '../types/settings';
import type { 
  SessionState, 
  SessionTab, 
  SessionWorkspace, 
  SessionWindow,
  SessionSettings,
  SessionRestoreOptions,
  SessionRestorePrompt,
} from '../types/session';

// ============================================================================
// Constants
// ============================================================================

const SESSION_STORAGE_KEY = 'seran-session-state';
const SESSION_SETTINGS_KEY = 'seran-session-settings';
const CRASH_FLAG_KEY = 'seran-session-active';
const SESSION_VERSION = '1.0.0';

const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  autoSaveEnabled: true,
  autoSaveInterval: 30000, // 30 seconds
  maxSessionsToKeep: 5,
  showRestorePrompt: true,
  alwaysRestore: false,
  saveOnClose: true,
};

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Load session settings
 */
export function loadSessionSettings(): SessionSettings {
  try {
    const saved = localStorage.getItem(SESSION_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SESSION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('[Session] Failed to load settings:', error);
  }
  return { ...DEFAULT_SESSION_SETTINGS };
}

/**
 * Save session settings
 */
export function saveSessionSettings(settings: SessionSettings): void {
  try {
    localStorage.setItem(SESSION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Session] Failed to save settings:', error);
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Session Conversion Functions
// ============================================================================

/**
 * Convert Tab to SessionTab
 */
function tabToSessionTab(tab: Tab): SessionTab {
  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
    favicon: tab.favicon,
    workspaceId: tab.workspaceId,
    containerId: tab.containerId,
    history: tab.history,
    historyIndex: tab.historyIndex,
    zoomLevel: tab.zoomLevel,
    isPinned: tab.isPinned,
    isMuted: tab.isMuted,
    lastAccessed: Date.now(),
  };
}

/**
 * Convert SessionTab to Tab
 */
function sessionTabToTab(sessionTab: SessionTab): Tab {
  return {
    id: sessionTab.id,
    title: sessionTab.title,
    url: sessionTab.url,
    favicon: sessionTab.favicon,
    isLoading: false,
    history: sessionTab.history,
    historyIndex: sessionTab.historyIndex,
    workspaceId: sessionTab.workspaceId,
    containerId: sessionTab.containerId,
    zoomLevel: sessionTab.zoomLevel,
    isPinned: sessionTab.isPinned,
    isMuted: sessionTab.isMuted,
  };
}

/**
 * Convert Workspace to SessionWorkspace
 */
function workspaceToSessionWorkspace(workspace: Workspace, tabs: Tab[]): SessionWorkspace {
  const workspaceTabs = tabs.filter(t => t.workspaceId === workspace.id);
  return {
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    tabIds: workspaceTabs.map(t => t.id),
  };
}

/**
 * Convert SessionWorkspace to Workspace
 */
function sessionWorkspaceToWorkspace(sessionWs: SessionWorkspace): Workspace {
  return {
    id: sessionWs.id,
    name: sessionWs.name,
    icon: sessionWs.icon,
    tabIds: sessionWs.tabIds,
  };
}

// ============================================================================
// Crash Detection
// ============================================================================

/**
 * Set crash detection flag (called on app start)
 */
export function setSessionActive(): void {
  try {
    localStorage.setItem(CRASH_FLAG_KEY, Date.now().toString());
  } catch (error) {
    console.error('[Session] Failed to set active flag:', error);
  }
}

/**
 * Clear crash detection flag (called on clean exit)
 */
export function clearSessionActive(): void {
  try {
    localStorage.removeItem(CRASH_FLAG_KEY);
  } catch (error) {
    console.error('[Session] Failed to clear active flag:', error);
  }
}

/**
 * Check if previous session crashed (flag was not cleared)
 */
export function didSessionCrash(): boolean {
  try {
    const flag = localStorage.getItem(CRASH_FLAG_KEY);
    return flag !== null;
  } catch (error) {
    console.error('[Session] Failed to check crash flag:', error);
    return false;
  }
}

/**
 * Get timestamp of last session
 */
export function getLastSessionTimestamp(): number | null {
  try {
    const flag = localStorage.getItem(CRASH_FLAG_KEY);
    return flag ? parseInt(flag, 10) : null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// Session Save/Load Functions
// ============================================================================

/**
 * Save current session state
 */
export function saveSession(
  tabs: Tab[],
  workspaces: Workspace[],
  containers: Container[],
  activeWorkspaceId: string,
  activeTabId: string,
  settings?: Partial<BrowserSettings>,
  reason: SessionState['reason'] = 'auto'
): SessionState {
  const session: SessionState = {
    id: generateSessionId(),
    version: SESSION_VERSION,
    savedAt: Date.now(),
    isAutoSave: reason === 'auto',
    reason,
    tabs: tabs.map(tabToSessionTab),
    workspaces: workspaces.map(ws => workspaceToSessionWorkspace(ws, tabs)),
    activeWorkspaceId,
    activeTabId,
    containers,
    window: getCurrentWindowState(),
    settings,
  };

  try {
    // Save to localStorage
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    console.log(`[Session] Saved session with ${tabs.length} tabs (${reason})`);
    
    // Also try to save to Electron storage for persistence
    const electron = (window as any).electron;
    if (electron?.session?.save) {
      electron.session.save(JSON.stringify(session)).catch((err: Error) => {
        console.warn('[Session] Failed to save to Electron storage:', err);
      });
    }
  } catch (error) {
    console.error('[Session] Failed to save session:', error);
  }

  return session;
}

/**
 * Load saved session state
 */
export function loadSession(): SessionState | null {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      const session = JSON.parse(saved) as SessionState;
      console.log(`[Session] Loaded session with ${session.tabs.length} tabs`);
      return session;
    }
  } catch (error) {
    console.error('[Session] Failed to load session:', error);
  }
  return null;
}

/**
 * Load session from Electron storage (more persistent than localStorage)
 */
export async function loadSessionFromStorage(): Promise<SessionState | null> {
  try {
    const electron = (window as any).electron;
    
    if (electron?.session?.load) {
      const result = await electron.session.load();
      if (result.success && result.data) {
        const session = JSON.parse(result.data) as SessionState;
        return session;
      }
    }
    
    // Fallback to localStorage
    return loadSession();
  } catch (error) {
    console.error('[Session] Failed to load from storage:', error);
    return loadSession();
  }
}

/**
 * Clear saved session
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    
    const electron = (window as any).electron;
    if (electron?.session?.clear) {
      electron.session.clear().catch(console.warn);
    }
    
    console.log('[Session] Cleared saved session');
  } catch (error) {
    console.error('[Session] Failed to clear session:', error);
  }
}

// ============================================================================
// Session Restore Functions
// ============================================================================

/**
 * Get restore prompt data
 */
export function getRestorePromptData(): SessionRestorePrompt | null {
  const session = loadSession();
  if (!session) return null;

  const crashDetected = didSessionCrash();
  const timeSinceSave = Date.now() - session.savedAt;

  return {
    session,
    tabCount: session.tabs.length,
    workspaceCount: session.workspaces.length,
    crashDetected,
    timeSinceSave,
  };
}

/**
 * Restore session and return tabs, workspaces, and containers
 */
export function restoreSession(
  session: SessionState,
  options: SessionRestoreOptions = {
    restoreTabs: true,
    restoreWorkspaces: true,
    restoreWindow: false,
    restoreSettings: false,
    mergeMode: 'replace',
  }
): {
  tabs: Tab[];
  workspaces: Workspace[];
  containers: Container[];
  activeWorkspaceId: string;
  activeTabId: string;
  settings?: Partial<BrowserSettings>;
} {
  const result: {
    tabs: Tab[];
    workspaces: Workspace[];
    containers: Container[];
    activeWorkspaceId: string;
    activeTabId: string;
    settings?: Partial<BrowserSettings>;
  } = {
    tabs: [],
    workspaces: [],
    containers: [],
    activeWorkspaceId: session.activeWorkspaceId,
    activeTabId: session.activeTabId,
  };

  if (options.restoreTabs) {
    result.tabs = session.tabs.map(sessionTabToTab);
  }

  if (options.restoreWorkspaces) {
    result.workspaces = session.workspaces.map(sessionWorkspaceToWorkspace);
    result.containers = session.containers;
  }

  if (options.restoreSettings && session.settings) {
    result.settings = session.settings;
  }

  if (options.restoreWindow) {
    restoreWindowState(session.window);
  }

  // Clear the crash flag after successful restore
  clearSessionActive();
  
  console.log(`[Session] Restored ${result.tabs.length} tabs and ${result.workspaces.length} workspaces`);
  
  return result;
}

// ============================================================================
// Window State Functions
// ============================================================================

/**
 * Get current window state
 */
function getCurrentWindowState(): SessionWindow {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMaximized: false, // Would need Electron IPC to get actual state
    isFullScreen: false,
  };
}

/**
 * Restore window state
 */
async function restoreWindowState(windowState: SessionWindow): Promise<void> {
  const electron = (window as any).electron;
  
  if (!electron) return;

  try {
    if (windowState.isMaximized) {
      await electron.maximize?.();
    } else if (windowState.isFullScreen) {
      await electron.toggleFullscreen?.();
    }
  } catch (error) {
    console.warn('[Session] Failed to restore window state:', error);
  }
}

// ============================================================================
// Auto-Save Manager
// ============================================================================

let autoSaveInterval: NodeJS.Timeout | null = null;
let saveCallback: (() => void) | null = null;

/**
 * Start auto-save interval
 */
export function startAutoSave(
  getSaveData: () => {
    tabs: Tab[];
    workspaces: Workspace[];
    containers: Container[];
    activeWorkspaceId: string;
    activeTabId: string;
    settings?: Partial<BrowserSettings>;
  }
): void {
  const settings = loadSessionSettings();
  
  if (!settings.autoSaveEnabled) {
    console.log('[Session] Auto-save disabled');
    return;
  }

  // Clear any existing interval
  stopAutoSave();

  // Set the session as active
  setSessionActive();

  // Create save callback
  saveCallback = () => {
    const data = getSaveData();
    saveSession(
      data.tabs,
      data.workspaces,
      data.containers,
      data.activeWorkspaceId,
      data.activeTabId,
      data.settings,
      'auto'
    );
    // Update active flag
    setSessionActive();
  };

  // Start interval
  autoSaveInterval = setInterval(saveCallback, settings.autoSaveInterval);
  console.log(`[Session] Auto-save started (interval: ${settings.autoSaveInterval}ms)`);
}

/**
 * Stop auto-save interval
 */
export function stopAutoSave(): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
    saveCallback = null;
    console.log('[Session] Auto-save stopped');
  }
}

/**
 * Trigger manual save
 */
export function triggerManualSave(): void {
  if (saveCallback) {
    saveCallback();
  }
}

/**
 * Format time since last save
 */
export function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// ============================================================================
// Cleanup on Window Close
// ============================================================================

/**
 * Handle window beforeunload event
 */
export function setupSessionCleanup(
  getSaveData: () => {
    tabs: Tab[];
    workspaces: Workspace[];
    containers: Container[];
    activeWorkspaceId: string;
    activeTabId: string;
    settings?: Partial<BrowserSettings>;
  }
): void {
  window.addEventListener('beforeunload', () => {
    const settings = loadSessionSettings();
    
    if (settings.saveOnClose) {
      const data = getSaveData();
      saveSession(
        data.tabs,
        data.workspaces,
        data.containers,
        data.activeWorkspaceId,
        data.activeTabId,
        data.settings,
        'close'
      );
    }
    
    // Clear the active flag on clean exit
    clearSessionActive();
  });
}

// ============================================================================
// Session Service Object (for convenience)
// ============================================================================

/**
 * Session service object grouping all session-related functions
 */
export const sessionService = {
  // Settings
  loadSettings: loadSessionSettings,
  saveSettings: saveSessionSettings,
  
  // Crash detection
  setActive: setSessionActive,
  clearActive: clearSessionActive,
  didCrash: didSessionCrash,
  getLastTimestamp: getLastSessionTimestamp,
  
  // Session management
  save: saveSession,
  load: loadSession,
  loadFromStorage: loadSessionFromStorage,
  clear: clearSession,
  
  // Restore
  getRestorePrompt: getRestorePromptData,
  restore: restoreSession,
  
  // Auto-save
  startAutoSave,
  stopAutoSave,
  triggerSave: triggerManualSave,
  
  // Cleanup
  setupCleanup: setupSessionCleanup,
  
  // Utility
  formatTimeSince,
  
  // Convenience methods
  hasSessionToRestore: async (): Promise<boolean> => {
    const session = await loadSessionFromStorage();
    return session !== null && session.tabs.length > 0;
  },
  
  loadSession: async (): Promise<SessionState | null> => {
    return loadSessionFromStorage();
  },
  
  clearSession: async (): Promise<void> => {
    clearSession();
    clearSessionActive();
  },
};
