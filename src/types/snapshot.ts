/**
 * Workspace Snapshot type definitions
 * For saving and sharing browser sessions
 */

import type { Tab, Workspace, Container, Bookmark } from './browser';
import type { BrowserSettings } from './settings';

/** Options for exporting a snapshot */
export interface SnapshotExportOptions {
  /** Include tab history */
  includeHistory?: boolean;
  /** Include bookmarks */
  includeBookmarks?: boolean;
  /** Include container data */
  includeContainers?: boolean;
  /** Include browser settings */
  includeSettings?: boolean;
  /** Encrypt the snapshot file */
  encrypt?: boolean;
  /** Password for encryption (required if encrypt is true) */
  password?: string;
  /** Omit sensitive data for sharing */
  sanitizeForSharing?: boolean;
}

/** Options for importing a snapshot */
export interface SnapshotImportOptions {
  /** Password for decryption (if encrypted) */
  password?: string;
  /** Merge with existing tabs or replace */
  mergeMode?: 'merge' | 'replace';
  /** Target workspace ID for imported tabs */
  targetWorkspaceId?: string;
}

/** Serialized tab data for snapshots (sanitized) */
export interface SnapshotTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  history?: string[];
  historyIndex?: number;
  workspaceId: string;
  containerId: string;
}

/** Serialized workspace data */
export interface SnapshotWorkspace {
  id: string;
  name: string;
  icon: string;
  tabIds: string[];
}

/** Serialized container data (non-sensitive) */
export interface SnapshotContainer {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDisposable: boolean;
}

/** Snapshot metadata */
export interface SnapshotMetadata {
  /** Unique snapshot ID */
  id: string;
  /** User-defined name for the snapshot */
  name: string;
  /** Description of the snapshot */
  description?: string;
  /** When the snapshot was created */
  createdAt: number;
  /** Version of the snapshot format */
  version: string;
  /** Browser version that created this snapshot */
  browserVersion: string;
  /** Number of tabs in the snapshot */
  tabCount: number;
  /** Number of workspaces */
  workspaceCount: number;
  /** Whether the snapshot is encrypted */
  isEncrypted: boolean;
  /** Whether sensitive data was omitted */
  isSanitized: boolean;
  /** Tags for organization */
  tags?: string[];
}

/** Complete workspace snapshot */
export interface WorkspaceSnapshot {
  /** Snapshot metadata */
  metadata: SnapshotMetadata;
  /** All tabs */
  tabs: SnapshotTab[];
  /** All workspaces */
  workspaces: SnapshotWorkspace[];
  /** Active workspace ID */
  activeWorkspaceId: string;
  /** Active tab ID */
  activeTabId: string;
  /** Container definitions (if included) */
  containers?: SnapshotContainer[];
  /** Bookmarks (if included) */
  bookmarks?: Bookmark[];
  /** Settings (if included) */
  settings?: Partial<BrowserSettings>;
}

/** Encrypted snapshot wrapper */
export interface EncryptedSnapshot {
  /** Encryption algorithm used */
  algorithm: 'AES-GCM';
  /** Initialization vector (base64) */
  iv: string;
  /** Salt for key derivation (base64) */
  salt: string;
  /** Encrypted data (base64) */
  data: string;
  /** Unencrypted metadata for preview */
  metadata: Pick<SnapshotMetadata, 'id' | 'name' | 'createdAt' | 'tabCount' | 'workspaceCount' | 'isEncrypted'>;
}

/** Result of snapshot operations */
export interface SnapshotResult {
  success: boolean;
  snapshot?: WorkspaceSnapshot;
  error?: string;
}

/** Saved snapshot entry for the snapshot manager */
export interface SavedSnapshotEntry {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  tabCount: number;
  workspaceCount: number;
  isEncrypted: boolean;
  isSanitized: boolean;
  filePath?: string;
  tags?: string[];
}
