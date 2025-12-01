/**
 * Snapshot Manager Component
 * UI for creating, managing, and restoring workspace snapshots
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Download,
  Upload,
  Trash2,
  Lock,
  Unlock,
  Share2,
  FolderOpen,
  Calendar,
  Layers,
  FileText,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from 'lucide-react';
import type { Tab, Workspace, Container, Bookmark } from '../../types/browser';
import type { BrowserSettings } from '../../types/settings';
import type {
  WorkspaceSnapshot,
  SnapshotExportOptions,
  SnapshotImportOptions,
  SavedSnapshotEntry,
  SnapshotMetadata,
} from '../../types/snapshot';
import {
  createSnapshot,
  exportSnapshot,
  importSnapshot,
  isSnapshotEncrypted,
  getSnapshotPreview,
  downloadSnapshot,
  readSnapshotFile,
  getSnapshotEntries,
  saveSnapshotToStorage,
  loadSnapshotFromStorage,
  deleteSnapshotFromStorage,
} from '../../services/snapshot';

interface SnapshotManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeTabId: string;
  containers: Container[];
  bookmarks: Bookmark[];
  settings: BrowserSettings;
  onRestoreSnapshot: (snapshot: WorkspaceSnapshot, options: SnapshotImportOptions) => void;
  onNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

type SnapshotView = 'list' | 'create' | 'import' | 'preview';

export const SnapshotManager: React.FC<SnapshotManagerProps> = ({
  isOpen,
  onClose,
  tabs,
  workspaces,
  activeWorkspaceId,
  activeTabId,
  containers,
  bookmarks,
  settings,
  onRestoreSnapshot,
  onNotification,
}) => {
  // State
  const [view, setView] = useState<SnapshotView>('list');
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshotEntry[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SavedSnapshotEntry | null>(null);
  const [previewData, setPreviewData] = useState<WorkspaceSnapshot | null>(null);
  
  // Create form state
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeBookmarks, setIncludeBookmarks] = useState(false);
  const [includeSettings, setIncludeSettings] = useState(false);
  const [encryptSnapshot, setEncryptSnapshot] = useState(false);
  const [sanitizeForSharing, setSanitizeForSharing] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Import state
  const [importData, setImportData] = useState<string>('');
  const [importPassword, setImportPassword] = useState('');
  const [importPreview, setImportPreview] = useState<SnapshotMetadata | null>(null);
  const [mergeMode, setMergeMode] = useState<'merge' | 'replace'>('merge');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved snapshots on mount
  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
    }
  }, [isOpen]);

  const refreshSnapshots = () => {
    setSavedSnapshots(getSnapshotEntries());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resetForm = () => {
    setSnapshotName('');
    setSnapshotDescription('');
    setIncludeHistory(true);
    setIncludeBookmarks(false);
    setIncludeSettings(false);
    setEncryptSnapshot(false);
    setSanitizeForSharing(false);
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  const resetImportForm = () => {
    setImportData('');
    setImportPassword('');
    setImportPreview(null);
    setMergeMode('merge');
    setError('');
  };

  // Create snapshot handler
  const handleCreateSnapshot = async () => {
    if (!snapshotName.trim()) {
      setError('Please enter a name for the snapshot');
      return;
    }
    
    if (encryptSnapshot && !password) {
      setError('Please enter a password for encryption');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const options: SnapshotExportOptions = {
        includeHistory,
        includeBookmarks,
        includeContainers: true,
        includeSettings,
        encrypt: encryptSnapshot,
        password: encryptSnapshot ? password : undefined,
        sanitizeForSharing,
      };

      const snapshot = createSnapshot(
        tabs,
        workspaces,
        activeWorkspaceId,
        activeTabId,
        containers,
        bookmarks,
        settings,
        snapshotName.trim(),
        snapshotDescription.trim(),
        options
      );

      const exported = await exportSnapshot(snapshot, options);
      
      // Save to local storage
      saveSnapshotToStorage(snapshot, exported);
      
      refreshSnapshots();
      resetForm();
      setView('list');
      onNotification('Snapshot Created', `"${snapshotName}" has been saved.`, 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snapshot');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export snapshot to file
  const handleExportToFile = async (entry: SavedSnapshotEntry) => {
    const data = loadSnapshotFromStorage(entry.id);
    if (!data) {
      onNotification('Error', 'Snapshot data not found', 'error');
      return;
    }
    
    const filename = `${entry.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}`;
    downloadSnapshot(data, filename);
    onNotification('Exported', `Snapshot exported as "${filename}.Seran-snapshot"`, 'success');
  };

  // Handle file import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readSnapshotFile(file);
      setImportData(content);
      
      const preview = getSnapshotPreview(content);
      setImportPreview(preview);
      
      if (isSnapshotEncrypted(content)) {
        setError('This snapshot is encrypted. Please enter the password.');
      } else {
        setError('');
      }
    } catch (err) {
      setError('Failed to read file');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import snapshot
  const handleImportSnapshot = async () => {
    if (!importData) {
      setError('Please select a snapshot file to import');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = await importSnapshot(importData, {
        password: importPassword || undefined,
        mergeMode,
      });

      if (!result.success || !result.snapshot) {
        setError(result.error || 'Failed to import snapshot');
        return;
      }

      // Save imported snapshot to local storage
      saveSnapshotToStorage(result.snapshot, importData);
      
      refreshSnapshots();
      resetImportForm();
      setView('list');
      onNotification(
        'Snapshot Imported',
        `"${result.snapshot.metadata.name}" has been imported.`,
        'success'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import snapshot');
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore snapshot
  const handleRestoreSnapshot = async (entry: SavedSnapshotEntry) => {
    const data = loadSnapshotFromStorage(entry.id);
    if (!data) {
      onNotification('Error', 'Snapshot data not found', 'error');
      return;
    }

    // If encrypted, we need to prompt for password
    if (entry.isEncrypted) {
      setSelectedSnapshot(entry);
      setView('preview');
      setImportData(data);
      setError('This snapshot is encrypted. Enter the password to restore.');
      return;
    }

    try {
      const result = await importSnapshot(data);
      if (result.success && result.snapshot) {
        onRestoreSnapshot(result.snapshot, { mergeMode });
        onClose();
        onNotification('Restored', `Workspace restored from "${entry.name}"`, 'success');
      } else {
        onNotification('Error', result.error || 'Failed to restore snapshot', 'error');
      }
    } catch (err) {
      onNotification('Error', 'Failed to restore snapshot', 'error');
    }
  };

  // Delete snapshot
  const handleDeleteSnapshot = (entry: SavedSnapshotEntry) => {
    deleteSnapshotFromStorage(entry.id);
    refreshSnapshots();
    onNotification('Deleted', `Snapshot "${entry.name}" has been deleted.`, 'info');
  };

  // Copy snapshot to clipboard
  const handleCopyToClipboard = async (entry: SavedSnapshotEntry) => {
    const data = loadSnapshotFromStorage(entry.id);
    if (!data) {
      onNotification('Error', 'Snapshot data not found', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(data);
      onNotification('Copied', 'Snapshot copied to clipboard', 'success');
    } catch (err) {
      onNotification('Error', 'Failed to copy to clipboard', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center space-x-3">
            <Camera className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Workspace Snapshots</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-700">
          <button
            onClick={() => { setView('list'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800/50'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FolderOpen className="w-4 h-4" />
              <span>Saved ({savedSnapshots.length})</span>
            </div>
          </button>
          <button
            onClick={() => { setView('create'); resetForm(); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              view === 'create'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800/50'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Create New</span>
            </div>
          </button>
          <button
            onClick={() => { setView('import'); resetImportForm(); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              view === 'import'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800/50'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* List View */}
          {view === 'list' && (
            <div className="space-y-3">
              {savedSnapshots.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">No snapshots saved yet</p>
                  <p className="text-zinc-500 text-sm mb-4">
                    Create a snapshot to save your current workspace state
                  </p>
                  <button
                    onClick={() => setView('create')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    Create Snapshot
                  </button>
                </div>
              ) : (
                savedSnapshots.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-zinc-100 truncate">{entry.name}</h3>
                          {entry.isEncrypted && (
                            <Lock className="w-4 h-4 text-yellow-400" title="Encrypted" />
                          )}
                          {entry.isSanitized && (
                            <Share2 className="w-4 h-4 text-green-400" title="Sanitized for sharing" />
                          )}
                        </div>
                        {entry.description && (
                          <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{entry.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-zinc-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(entry.createdAt)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>{entry.tabCount} tabs</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Layers className="w-3 h-3" />
                            <span>{entry.workspaceCount} workspaces</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => handleRestoreSnapshot(entry)}
                          className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-green-400 transition-colors"
                          title="Restore"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportToFile(entry)}
                          className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 transition-colors"
                          title="Export to file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyToClipboard(entry)}
                          className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(entry)}
                          className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Create View */}
          {view === 'create' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <p className="text-sm text-zinc-400 mb-2">Current session:</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-zinc-100">{tabs.length} tabs</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-100">{workspaces.length} workspaces</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-100">{bookmarks.length} bookmarks</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Snapshot Name *
                </label>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="e.g., Research Session - Dec 2025"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={snapshotDescription}
                  onChange={(e) => setSnapshotDescription(e.target.value)}
                  placeholder="Add notes about this snapshot..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-300">Include:</p>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-zinc-300">Tab navigation history</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBookmarks}
                    onChange={(e) => setIncludeBookmarks(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-zinc-300">Bookmarks</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSettings}
                    onChange={(e) => setIncludeSettings(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-zinc-300">Browser settings</span>
                </label>
              </div>

              <div className="border-t border-zinc-700 pt-4 space-y-3">
                <p className="text-sm font-medium text-zinc-300">Security & Sharing:</p>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={encryptSnapshot}
                    onChange={(e) => setEncryptSnapshot(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <Lock className="w-4 h-4 text-yellow-400" />
                  <span className="text-zinc-300">Encrypt with password</span>
                </label>

                {encryptSnapshot && (
                  <div className="ml-7">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter encryption password"
                        className="w-full px-3 py-2 pr-10 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sanitizeForSharing}
                    onChange={(e) => setSanitizeForSharing(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <Share2 className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Sanitize for sharing (remove sensitive URL params)</span>
                </label>
              </div>

              <button
                onClick={handleCreateSnapshot}
                disabled={isProcessing || !snapshotName.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Create Snapshot</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Import View */}
          {view === 'import' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center hover:border-zinc-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-300 mb-1">Click to select a snapshot file</p>
                <p className="text-zinc-500 text-sm">or drag and drop (.Seran-snapshot)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".Seran-snapshot,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {importPreview && (
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <h4 className="font-medium text-zinc-100 mb-2 flex items-center space-x-2">
                    <span>{importPreview.name}</span>
                    {importPreview.isEncrypted && <Lock className="w-4 h-4 text-yellow-400" />}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-zinc-400">
                    <span>{importPreview.tabCount} tabs</span>
                    <span>•</span>
                    <span>{importPreview.workspaceCount} workspaces</span>
                    <span>•</span>
                    <span>{formatDate(importPreview.createdAt)}</span>
                  </div>
                </div>
              )}

              {importData && isSnapshotEncrypted(importData) && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Decryption Password
                  </label>
                  <input
                    type="password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    placeholder="Enter password to decrypt"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {importData && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Import Mode
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={mergeMode === 'merge'}
                        onChange={() => setMergeMode('merge')}
                        className="w-4 h-4 border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-zinc-300">Merge with existing tabs</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={mergeMode === 'replace'}
                        onChange={() => setMergeMode('replace')}
                        className="w-4 h-4 border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-zinc-300">Replace all tabs</span>
                    </label>
                  </div>
                </div>
              )}

              <button
                onClick={handleImportSnapshot}
                disabled={isProcessing || !importData}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import Snapshot</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Preview View (for encrypted snapshots) */}
          {view === 'preview' && selectedSnapshot && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <h4 className="font-medium text-zinc-100 mb-2 flex items-center space-x-2">
                  <span>{selectedSnapshot.name}</span>
                  <Lock className="w-4 h-4 text-yellow-400" />
                </h4>
                <div className="flex items-center space-x-4 text-sm text-zinc-400">
                  <span>{selectedSnapshot.tabCount} tabs</span>
                  <span>•</span>
                  <span>{selectedSnapshot.workspaceCount} workspaces</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Decryption Password
                </label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => {
                    setImportPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter password to decrypt and restore"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setView('list');
                    setSelectedSnapshot(null);
                    setImportData('');
                    setImportPassword('');
                    setError('');
                  }}
                  className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!importPassword) {
                      setError('Please enter the password');
                      return;
                    }

                    setIsProcessing(true);
                    try {
                      const result = await importSnapshot(importData, { password: importPassword, mergeMode });
                      if (result.success && result.snapshot) {
                        onRestoreSnapshot(result.snapshot, { mergeMode });
                        onClose();
                        onNotification('Restored', `Workspace restored from "${selectedSnapshot.name}"`, 'success');
                      } else {
                        setError(result.error || 'Failed to decrypt snapshot');
                      }
                    } catch (err) {
                      setError('Failed to decrypt. Check your password.');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing || !importPassword}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Decrypt & Restore</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnapshotManager;
