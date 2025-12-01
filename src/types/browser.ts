/**
 * Browser-related type definitions
 */

/** Represents a browser tab */
export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  history: string[];
  historyIndex: number;
  workspaceId: string;
  containerId: string;
}

/** Container for context isolation (like Firefox containers) */
export interface Container {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDisposable: boolean;
}

/** Workspace grouping for tabs */
export interface Workspace {
  id: string;
  name: string;
  icon: string;
  tabIds: string[];
}

/** Bookmark entry */
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  dateAdded: number;
}

/** Browser history entry */
export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: number;
}

/** Offline saved page */
export interface OfflinePage {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string;
  savedAt: number;
  synced: boolean;
  size: string;
}

/** Download item */
export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: DownloadState;
  startTime: number;
  endTime?: number;
}

export type DownloadState = 'progressing' | 'completed' | 'interrupted' | 'cancelled';

/** Browser extension */
export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  enabled: boolean;
  permissions: string[];
}
