/**
 * Session Restore Prompt Component
 * 
 * Shows when the browser starts after a crash or unexpected close,
 * offering to restore the previous session.
 */

import React, { useState, useEffect } from 'react';
import type { SessionRestorePrompt as SessionRestoreData, SessionRestoreOptions } from '../../types/session';
import {
  getRestorePromptData,
  restoreSession,
  clearSession,
  formatTimeSince,
  clearSessionActive,
} from '../../services/session';
import {
  RefreshCcw, X, AlertTriangle, Clock, Layers, Globe,
  CheckCircle2, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SessionRestorePromptProps {
  onRestore: (data: ReturnType<typeof restoreSession>) => void;
  onDismiss: () => void;
  onNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const SessionRestorePrompt: React.FC<SessionRestorePromptProps> = ({
  onRestore,
  onDismiss,
  onNotification,
}) => {
  // State
  const [promptData, setPromptData] = useState<SessionRestoreData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [options, setOptions] = useState<SessionRestoreOptions>({
    restoreTabs: true,
    restoreWorkspaces: true,
    restoreWindow: false,
    restoreSettings: false,
    mergeMode: 'replace',
  });

  // Load prompt data on mount
  useEffect(() => {
    const data = getRestorePromptData();
    if (data) {
      setPromptData(data);
    }
  }, []);

  // Handlers
  const handleRestore = () => {
    if (!promptData) return;

    setIsRestoring(true);
    
    try {
      const restoredData = restoreSession(promptData.session, options);
      onRestore(restoredData);
      onNotification?.(
        'Session Restored',
        `Restored ${restoredData.tabs.length} tabs and ${restoredData.workspaces.length} workspaces.`,
        'success'
      );
    } catch (error: any) {
      onNotification?.('Restore Failed', error.message, 'error');
    }

    setIsRestoring(false);
  };

  const handleDismiss = () => {
    clearSession();
    clearSessionActive();
    onDismiss();
  };

  if (!promptData) return null;

  const { session, tabCount, workspaceCount, crashDetected, timeSinceSave } = promptData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-[460px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div 
          className={`px-6 py-5 flex items-start gap-4 ${
            crashDetected ? 'bg-amber-500/10' : 'bg-blue-500/10'
          }`}
        >
          <div 
            className={`p-3 rounded-xl ${
              crashDetected 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {crashDetected ? <AlertTriangle size={24} /> : <RefreshCcw size={24} />}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {crashDetected ? 'Restore Your Session?' : 'Welcome Back!'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {crashDetected 
                ? 'Your previous session ended unexpectedly. Would you like to restore it?'
                : 'Your previous session is available. Would you like to restore it?'
              }
            </p>
          </div>
        </div>

        {/* Session Info */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-blue-400" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>{tabCount}</strong> tabs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-purple-400" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>{workspaceCount}</strong> workspaces
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-zinc-400" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {formatTimeSince(session.savedAt)}
              </span>
            </div>
          </div>

          {/* Tab Preview */}
          {session.tabs.length > 0 && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showDetails ? 'Hide' : 'Show'} tab details
              </button>
              
              {showDetails && (
                <div 
                  className="max-h-[200px] overflow-y-auto rounded-lg p-2 space-y-1"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  {session.tabs.slice(0, 20).map(tab => (
                    <div 
                      key={tab.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50"
                    >
                      {tab.favicon ? (
                        <img src={tab.favicon} alt="" className="w-4 h-4" />
                      ) : (
                        <Globe size={14} className="text-zinc-500" />
                      )}
                      <span 
                        className="text-xs truncate flex-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {tab.title}
                      </span>
                    </div>
                  ))}
                  {session.tabs.length > 20 && (
                    <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                      +{session.tabs.length - 20} more tabs
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="px-6 py-4 space-y-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Restore Options
          </p>
          
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'restoreTabs', label: 'Tabs' },
              { key: 'restoreWorkspaces', label: 'Workspaces' },
              { key: 'restoreWindow', label: 'Window Size' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setOptions(o => ({ ...o, [key]: !o[key as keyof SessionRestoreOptions] }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  options[key as keyof SessionRestoreOptions]
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700'
                }`}
              >
                {options[key as keyof SessionRestoreOptions] && <CheckCircle2 size={12} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Trash2 size={16} />
            Start Fresh
          </button>
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex-1 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isRestoring ? (
              <RefreshCcw size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            Restore Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRestorePrompt;
