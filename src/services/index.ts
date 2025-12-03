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

// Password Manager
export {
  // Vault management
  setupVault,
  unlockVault,
  lockVault,
  isVaultSetup,
  isVaultUnlocked,
  getVaultSettings,
  // Credential management
  saveCredential,
  updateCredential,
  deleteCredential,
  getAllCredentials,
  decryptPassword,
  getCredentialsForDomain,
  searchCredentials,
  recordUsage,
  // Autofill
  getAutofillSuggestions,
  // Password utilities
  generatePassword,
  analyzePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  extractDomain,
  getPasswordStats,
  exportCredentials,
} from './passwords';

// Autofill
export {
  getAutofillScript,
  getAutofillFillScript,
  getPasswordFieldCheckScript,
  setPendingCredential,
  getPendingCredential,
  clearPendingCredential,
  savePendingCredential,
  credentialExists,
  getSuggestionsForUrl,
  getSavePromptData,
} from './autofill';

// Proxy/VPN
export {
  loadProxySettings,
  saveProxySettings,
  createProxyConfig,
  addProxyConfig,
  updateProxyConfig,
  deleteProxyConfig,
  createFromPreset,
  getProxyStatus,
  buildProxyUrl,
  buildProxyRules,
  connectProxy,
  disconnectProxy,
  testProxyConnection,
  getCurrentIp,
  countryCodeToFlag,
  getCountryName,
  PROXY_PRESETS,
} from './proxy';

// Session Restore
export {
  loadSessionSettings,
  saveSessionSettings,
  setSessionActive,
  clearSessionActive,
  didSessionCrash,
  getLastSessionTimestamp,
  saveSession,
  loadSession,
  loadSessionFromStorage,
  clearSession,
  getRestorePromptData,
  restoreSession,
  startAutoSave,
  stopAutoSave,
  triggerManualSave,
  formatTimeSince,
  setupSessionCleanup,
  sessionService,
} from './session';

// Screenshot
export {
  loadSavedScreenshots,
  saveScreenshot,
  deleteScreenshot,
  clearAllScreenshots,
  captureVisibleArea,
  captureFullPage,
  captureSelection,
  captureElement,
  downloadScreenshot,
  copyScreenshotToClipboard,
  saveScreenshotWithDialog,
  blobToDataUrl,
  dataUrlToBlob,
  formatToMimeType,
  formatToExtension,
  formatFileSize,
  estimateDataUrlSize,
  getSelectionRect,
} from './screenshot';
