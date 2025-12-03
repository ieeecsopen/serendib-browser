/**
 * Session Restore Prompt Component
 * 
 * Shows when the browser starts after a crash or unexpected close,
 * offering to restore the previous session.
 */

import React, { useState } from 'react';
import type { SessionState, SessionRestoreOptions } from '../../types/session';
import {
  formatTimeSince,
} from '../../services/session';
import {
  RefreshCcw, X, AlertTriangle, Clock, Layers, Globe,
  CheckCircle2, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SessionRestorePromptProps {
  isVisible: boolean;
  sessionState: SessionState | null;
  onRestore: () => void;
  onDismiss: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const SessionRestorePrompt: React.FC<SessionRestorePromptProps> = ({
  isVisible,
  sessionState,
  onRestore,
  onDismiss,
}) => {
  // State
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Handlers
  const handleRestore = () => {
    setIsRestoring(true);
    onRestore();
    setIsRestoring(false);
  };

  const handleDismiss = () => {
    onDismiss();
  };

  if (!isVisible || !sessionState) return null;

  const tabCount = sessionState.tabs.length;
  const workspaceCount = sessionState.workspaces?.length || 0;
  const crashDetected = sessionState.reason === 'crash' || sessionState.reason === 'auto';

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
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
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
                {formatTimeSince(sessionState.savedAt || sessionState.timestamp || Date.now())}
              </span>
            </div>
          </div>

          {/* Tab Preview */}
          {sessionState.tabs.length > 0 && (
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
                  {sessionState.tabs.slice(0, 20).map(tab => (
                    <div 
                      key={tab.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50"
                    >
                      <Globe size={14} className="text-zinc-500" />
                      <span 
                        className="text-xs truncate flex-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {tab.title}
                      </span>
                    </div>
                  ))}
                  {sessionState.tabs.length > 20 && (
                    <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                      +{sessionState.tabs.length - 20} more tabs
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
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
