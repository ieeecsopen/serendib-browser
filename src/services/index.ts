/**
 * Services Barrel Export
 */

export { generateCompletion, summarizeText, rewriteText, explainConcepts } from './gemini';

export {
  createSnapshot,
  exportSnapshot,
  importSnapshot,
  isSnapshotEncrypted,
  getSnapshotPreview,
  snapshotTabsToTabs,
  snapshotWorkspacesToWorkspaces,
  snapshotContainersToContainers,
  downloadSnapshot,
  readSnapshotFile,
  saveSnapshotEntry,
  getSnapshotEntries,
  deleteSnapshotEntry,
  saveSnapshotToStorage,
  loadSnapshotFromStorage,
  deleteSnapshotFromStorage,
} from './snapshot';

export {
  // Storage
  getOfflinePages,
  saveOfflinePages,
  getOfflinePage,
  isPageSavedOffline,
  saveOfflinePage,
  deleteOfflinePage,
  updateLastAccessed,
  // Tags
  addTagsToPage,
  removeTagFromPage,
  getAllTags,
  getPagesByTag,
  // Search
  searchOfflinePages,
  getRecentPages,
  // Article extraction
  extractMetadata,
  extractArticleContent,
  extractImages,
  createOfflinePageFromHtml,
  // Utilities
  getDeviceId,
  formatBytes,
  calculateReadingTime,
  calculateWordCount,
  extractTextFromHtml,
  createExcerpt,
  // Sync
  getSyncConfig,
  saveSyncConfig,
  getPendingSyncPages,
  markPageSynced,
  exportPagesAsJson,
  importPagesFromJson,
  getStorageStats,
} from './offline';
