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
  /** Zoom level (1.0 = 100%) */
  zoomLevel?: number;
  /** Whether this tab is pinned */
  isPinned?: boolean;
  /** Whether this tab is muted */
  isMuted?: boolean;
  /** Whether this tab is playing audio */
  isPlayingAudio?: boolean;
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
  /** Original page favicon */
  favicon?: string;
  /** Author of the article (if extracted) */
  author?: string;
  /** Publication date (if extracted) */
  publishedDate?: string;
  /** Site name */
  siteName?: string;
  /** Reading time in minutes */
  readingTime?: number;
  /** Word count */
  wordCount?: number;
  /** Main image URL (saved locally) */
  heroImage?: string;
  /** All saved images (local paths) */
  images?: OfflineImage[];
  /** Tags for organization */
  tags?: string[];
  /** Last accessed timestamp */
  lastAccessedAt?: number;
  /** Sync status */
  syncStatus?: 'pending' | 'synced' | 'failed' | 'local-only';
  /** Device that created this page */
  deviceId?: string;
}

/** Offline image reference */
export interface OfflineImage {
  id: string;
  originalUrl: string;
  localPath: string;
  width?: number;
  height?: number;
  size: number;
}

/** Options for saving offline pages */
export interface OfflineSaveOptions {
  /** Include images */
  includeImages?: boolean;
  /** Maximum number of images to save */
  maxImages?: number;
  /** Maximum image size in bytes (skip larger images) */
  maxImageSize?: number;
  /** Use reader mode extraction */
  useReaderMode?: boolean;
  /** Custom tags */
  tags?: string[];
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

/** Permission types that can be controlled per site */
export type PermissionType = 
  | 'camera'
  | 'microphone'
  | 'location'
  | 'notifications'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'autoplay'
  | 'popups';

/** Permission setting for a specific permission */
export type PermissionSetting = 'allow' | 'block' | 'ask';

/** Site-specific permission settings */
export interface SitePermissions {
  /** The origin (e.g., "https://example.com") */
  origin: string;
  /** Individual permission settings */
  permissions: Partial<Record<PermissionType, PermissionSetting>>;
  /** When these permissions were last modified */
  lastModified: number;
}

/** Global default permission settings */
export interface DefaultPermissions {
  camera: PermissionSetting;
  microphone: PermissionSetting;
  location: PermissionSetting;
  notifications: PermissionSetting;
  'clipboard-read': PermissionSetting;
  'clipboard-write': PermissionSetting;
  autoplay: PermissionSetting;
  popups: PermissionSetting;
}
