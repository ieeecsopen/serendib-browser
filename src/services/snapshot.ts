/**
 * Workspace Snapshot Service
 * Handles creating, saving, loading, and sharing workspace snapshots
 */

import type {
  WorkspaceSnapshot,
  SnapshotMetadata,
  SnapshotExportOptions,
  SnapshotImportOptions,
  SnapshotTab,
  SnapshotWorkspace,
  SnapshotContainer,
  EncryptedSnapshot,
  SnapshotResult,
  SavedSnapshotEntry,
} from '../types/snapshot';
import type { Tab, Workspace, Container, Bookmark } from '../types/browser';
import type { BrowserSettings } from '../types/settings';

// Constants
const SNAPSHOT_VERSION = '1.0.0';
const BROWSER_VERSION = '1.0.0';
const SNAPSHOT_FILE_EXTENSION = '.Seran-snapshot';
const SENSITIVE_URL_PATTERNS = [
  /password/i,
  /token/i,
  /auth/i,
  /secret/i,
  /api[_-]?key/i,
  /session/i,
  /oauth/i,
];

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data: string, password: string): Promise<{ iv: string; salt: string; encrypted: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataBuffer
  );
  
  return {
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    encrypted: arrayBufferToBase64(encryptedBuffer),
  };
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encrypted: string, iv: string, salt: string, password: string): Promise<string> {
  const saltBuffer = new Uint8Array(base64ToArrayBuffer(salt));
  const ivBuffer = new Uint8Array(base64ToArrayBuffer(iv));
  const encryptedBuffer = base64ToArrayBuffer(encrypted);
  
  const key = await deriveKey(password, saltBuffer);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encryptedBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Check if a URL contains potentially sensitive data
 */
function isSensitiveUrl(url: string): boolean {
  return SENSITIVE_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Sanitize a URL for sharing (remove query params from sensitive URLs)
 */
function sanitizeUrl(url: string): string {
  if (!isSensitiveUrl(url)) return url;
  
  try {
    const urlObj = new URL(url);
    // Remove query parameters for sensitive URLs
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Convert Tab to SnapshotTab
 */
function tabToSnapshotTab(tab: Tab, options: SnapshotExportOptions): SnapshotTab {
  const snapshotTab: SnapshotTab = {
    id: tab.id,
    title: tab.title,
    url: options.sanitizeForSharing ? sanitizeUrl(tab.url) : tab.url,
    workspaceId: tab.workspaceId,
    containerId: tab.containerId,
  };
  
  if (tab.favicon) {
    snapshotTab.favicon = tab.favicon;
  }
  
  if (options.includeHistory && tab.history) {
    snapshotTab.history = options.sanitizeForSharing 
      ? tab.history.map(sanitizeUrl)
      : [...tab.history];
    snapshotTab.historyIndex = tab.historyIndex;
  }
  
  return snapshotTab;
}

/**
 * Convert Workspace to SnapshotWorkspace
 */
function workspaceToSnapshotWorkspace(workspace: Workspace): SnapshotWorkspace {
  return {
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    tabIds: [...workspace.tabIds],
  };
}

/**
 * Convert Container to SnapshotContainer
 */
function containerToSnapshotContainer(container: Container): SnapshotContainer {
  return {
    id: container.id,
    name: container.name,
    color: container.color,
    icon: container.icon,
    isDisposable: container.isDisposable,
  };
}

/**
 * Create a workspace snapshot
 */
export function createSnapshot(
  tabs: Tab[],
  workspaces: Workspace[],
  activeWorkspaceId: string,
  activeTabId: string,
  containers: Container[],
  bookmarks: Bookmark[],
  settings: BrowserSettings,
  name: string,
  description: string = '',
  options: SnapshotExportOptions = {}
): WorkspaceSnapshot {
  const metadata: SnapshotMetadata = {
    id: generateId(),
    name,
    description,
    createdAt: Date.now(),
    version: SNAPSHOT_VERSION,
    browserVersion: BROWSER_VERSION,
    tabCount: tabs.length,
    workspaceCount: workspaces.length,
    isEncrypted: options.encrypt || false,
    isSanitized: options.sanitizeForSharing || false,
    tags: [],
  };
  
  const snapshot: WorkspaceSnapshot = {
    metadata,
    tabs: tabs.map(tab => tabToSnapshotTab(tab, options)),
    workspaces: workspaces.map(workspaceToSnapshotWorkspace),
    activeWorkspaceId,
    activeTabId,
  };
  
  if (options.includeContainers !== false) {
    snapshot.containers = containers
      .filter(c => !c.isDisposable) // Don't include disposable containers
      .map(containerToSnapshotContainer);
  }
  
  if (options.includeBookmarks) {
    snapshot.bookmarks = bookmarks.map(b => ({
      ...b,
      url: options.sanitizeForSharing ? sanitizeUrl(b.url) : b.url,
    }));
  }
  
  if (options.includeSettings) {
    // Only include non-sensitive settings
    snapshot.settings = {
      homeUrl: options.sanitizeForSharing ? undefined : settings.homeUrl,
      searchEngine: settings.searchEngine,
      theme: settings.theme,
      language: settings.language,
      verticalTabs: settings.verticalTabs,
      accentColor: settings.accentColor,
      dataSaver: settings.dataSaver,
      memorySaver: settings.memorySaver,
      lowSpecMode: settings.lowSpecMode,
    };
  }
  
  return snapshot;
}

/**
 * Export snapshot to JSON string (optionally encrypted)
 */
export async function exportSnapshot(
  snapshot: WorkspaceSnapshot,
  options: SnapshotExportOptions = {}
): Promise<string> {
  const jsonData = JSON.stringify(snapshot, null, 2);
  
  if (options.encrypt && options.password) {
    const { iv, salt, encrypted } = await encryptData(jsonData, options.password);
    
    const encryptedSnapshot: EncryptedSnapshot = {
      algorithm: 'AES-GCM',
      iv,
      salt,
      data: encrypted,
      metadata: {
        id: snapshot.metadata.id,
        name: snapshot.metadata.name,
        createdAt: snapshot.metadata.createdAt,
        tabCount: snapshot.metadata.tabCount,
        workspaceCount: snapshot.metadata.workspaceCount,
        isEncrypted: true,
      },
    };
    
    return JSON.stringify(encryptedSnapshot, null, 2);
  }
  
  return jsonData;
}

/**
 * Import snapshot from JSON string
 */
export async function importSnapshot(
  data: string,
  options: SnapshotImportOptions = {}
): Promise<SnapshotResult> {
  try {
    const parsed = JSON.parse(data);
    
    // Check if encrypted
    if (parsed.algorithm === 'AES-GCM') {
      if (!options.password) {
        return {
          success: false,
          error: 'This snapshot is encrypted. Please provide a password.',
        };
      }
      
      try {
        const decrypted = await decryptData(
          parsed.data,
          parsed.iv,
          parsed.salt,
          options.password
        );
        const snapshot = JSON.parse(decrypted) as WorkspaceSnapshot;
        return { success: true, snapshot };
      } catch (err) {
        return {
          success: false,
          error: 'Failed to decrypt snapshot. Please check your password.',
        };
      }
    }
    
    // Non-encrypted snapshot
    if (!parsed.metadata || !parsed.tabs || !parsed.workspaces) {
      return {
        success: false,
        error: 'Invalid snapshot format.',
      };
    }
    
    return { success: true, snapshot: parsed as WorkspaceSnapshot };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse snapshot: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if a snapshot string is encrypted
 */
export function isSnapshotEncrypted(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    return parsed.algorithm === 'AES-GCM';
  } catch {
    return false;
  }
}

/**
 * Get snapshot metadata without decrypting
 */
export function getSnapshotPreview(data: string): SnapshotMetadata | null {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.algorithm === 'AES-GCM') {
      // Return limited metadata for encrypted snapshots
      return {
        ...parsed.metadata,
        version: 'encrypted',
        browserVersion: 'unknown',
        isSanitized: false,
      };
    }
    
    return parsed.metadata || null;
  } catch {
    return null;
  }
}

/**
 * Convert snapshot tabs back to regular tabs
 */
export function snapshotTabsToTabs(
  snapshotTabs: SnapshotTab[],
  targetWorkspaceId?: string
): Tab[] {
  return snapshotTabs.map(st => ({
    id: generateId(), // Generate new IDs to avoid conflicts
    title: st.title,
    url: st.url,
    favicon: st.favicon,
    isLoading: false,
    history: st.history || [st.url],
    historyIndex: st.historyIndex ?? 0,
    workspaceId: targetWorkspaceId || st.workspaceId,
    containerId: st.containerId || 'cont-default',
  }));
}

/**
 * Convert snapshot workspaces back to regular workspaces
 */
export function snapshotWorkspacesToWorkspaces(
  snapshotWorkspaces: SnapshotWorkspace[],
  prefix: string = ''
): Workspace[] {
  return snapshotWorkspaces.map(sw => ({
    id: prefix ? `${prefix}-${sw.id}` : generateId(),
    name: sw.name,
    icon: sw.icon,
    tabIds: [], // Will be populated when tabs are created
  }));
}

/**
 * Convert snapshot containers back to regular containers
 */
export function snapshotContainersToContainers(
  snapshotContainers: SnapshotContainer[]
): Container[] {
  return snapshotContainers.map(sc => ({
    id: sc.id,
    name: sc.name,
    color: sc.color,
    icon: sc.icon,
    isDisposable: sc.isDisposable,
  }));
}

/**
 * Download snapshot as file
 */
export function downloadSnapshot(snapshotJson: string, filename: string): void {
  const blob = new Blob([snapshotJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith(SNAPSHOT_FILE_EXTENSION) 
    ? filename 
    : `${filename}${SNAPSHOT_FILE_EXTENSION}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read snapshot from file input
 */
export function readSnapshotFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Save snapshot entry to local storage
 */
export function saveSnapshotEntry(entry: SavedSnapshotEntry): void {
  const entries = getSnapshotEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  localStorage.setItem('Seran-snapshots', JSON.stringify(entries));
}

/**
 * Get all saved snapshot entries from local storage
 */
export function getSnapshotEntries(): SavedSnapshotEntry[] {
  try {
    const data = localStorage.getItem('Seran-snapshots');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Delete a snapshot entry from local storage
 */
export function deleteSnapshotEntry(id: string): void {
  const entries = getSnapshotEntries();
  const filtered = entries.filter(e => e.id !== id);
  localStorage.setItem('Seran-snapshots', JSON.stringify(filtered));
}

/**
 * Save full snapshot to local storage
 */
export function saveSnapshotToStorage(snapshot: WorkspaceSnapshot, encrypted: string): void {
  localStorage.setItem(`Seran-snapshot-${snapshot.metadata.id}`, encrypted);
  
  saveSnapshotEntry({
    id: snapshot.metadata.id,
    name: snapshot.metadata.name,
    description: snapshot.metadata.description,
    createdAt: snapshot.metadata.createdAt,
    tabCount: snapshot.metadata.tabCount,
    workspaceCount: snapshot.metadata.workspaceCount,
    isEncrypted: snapshot.metadata.isEncrypted,
    isSanitized: snapshot.metadata.isSanitized,
    tags: snapshot.metadata.tags,
  });
}

/**
 * Load snapshot from local storage
 */
export function loadSnapshotFromStorage(id: string): string | null {
  return localStorage.getItem(`Seran-snapshot-${id}`);
}

/**
 * Delete snapshot from local storage
 */
export function deleteSnapshotFromStorage(id: string): void {
  localStorage.removeItem(`Seran-snapshot-${id}`);
  deleteSnapshotEntry(id);
}
