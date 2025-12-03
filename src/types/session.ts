/**
 * Session Restore Type Definitions
 */

import type { Tab, Workspace, Container, Bookmark } from './browser';
import type { BrowserSettings } from './settings';

/** Session state that can be saved and restored */
export interface SessionState {
  /** Unique session ID */
  id: string;
  /** Session version for compatibility */
  version: string;
  /** Timestamp when session was saved */
  savedAt: number;
  /** Whether this was an auto-save or manual save */
  isAutoSave: boolean;
  /** Reason for session save */
  reason: 'auto' | 'manual' | 'crash' | 'update' | 'close';
  /** All open tabs */
  tabs: SessionTab[];
  /** All workspaces */
  workspaces: SessionWorkspace[];
  /** Active workspace ID */
  activeWorkspaceId: string;
  /** Active tab ID */
  activeTabId: string;
  /** Container configurations */
  containers: Container[];
  /** Window state */
  window: SessionWindow;
  /** Browser settings (optional) */
  settings?: Partial<BrowserSettings>;
}

/** Tab data for session storage */
export interface SessionTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  workspaceId: string;
  containerId: string;
  /** Navigation history */
  history: string[];
  historyIndex: number;
  /** Scroll position */
  scrollPosition?: { x: number; y: number };
  /** Zoom level */
  zoomLevel?: number;
  /** Is tab pinned */
  isPinned?: boolean;
  /** Is tab muted */
  isMuted?: boolean;
  /** Last accessed timestamp */
  lastAccessed?: number;
}

/** Workspace data for session storage */
export interface SessionWorkspace {
  id: string;
  name: string;
  icon: string;
  tabIds: string[];
}

/** Window state for session */
export interface SessionWindow {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

/** Session restore options */
export interface SessionRestoreOptions {
  /** Restore tabs */
  restoreTabs: boolean;
  /** Restore workspaces */
  restoreWorkspaces: boolean;
  /** Restore window position/size */
  restoreWindow: boolean;
  /** Restore settings */
  restoreSettings: boolean;
  /** Merge with existing tabs or replace */
  mergeMode: 'merge' | 'replace';
}

/** Session manager settings */
export interface SessionSettings {
  /** Enable auto-save */
  autoSaveEnabled: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number;
  /** Maximum number of sessions to keep */
  maxSessionsToKeep: number;
  /** Show restore prompt on startup after crash */
  showRestorePrompt: boolean;
  /** Always restore previous session on startup */
  alwaysRestore: boolean;
  /** Save session on close */
  saveOnClose: boolean;
}

/** Session restore prompt data */
export interface SessionRestorePrompt {
  session: SessionState;
  tabCount: number;
  workspaceCount: number;
  crashDetected: boolean;
  timeSinceSave: number;
}
