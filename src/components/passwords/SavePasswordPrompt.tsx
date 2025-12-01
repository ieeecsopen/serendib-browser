/**
 * Save Password Prompt Component
 * 
 * A toast-style prompt that appears when a user submits a login form,
 * asking if they want to save the credentials.
 */

import React, { useState, useEffect } from 'react';
import { Key, X, Check, Ban, Eye, EyeOff } from 'lucide-react';

interface SavePasswordPromptProps {
  isVisible: boolean;
  domain: string;
  username: string;
  password: string;
  favicon?: string;
  isUpdate?: boolean;
  onSave: () => void;
  onNeverSave: () => void;
  onDismiss: () => void;
}

export const SavePasswordPrompt: React.FC<SavePasswordPromptProps> = ({
  isVisible,
  domain,
  username,
  password,
  favicon,
  isUpdate = false,
  onSave,
  onNeverSave,
  onDismiss,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  if (!isVisible && !isAnimating) return null;

  const handleAnimationEnd = () => {
    if (!isVisible) {
      setIsAnimating(false);
    }
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[9999] w-96 
        bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      onTransitionEnd={handleAnimationEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            {favicon ? (
              <img src={favicon} alt="" className="w-5 h-5 rounded" />
            ) : (
              <Key size={20} className="text-white" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isUpdate ? 'Update password?' : 'Save password?'}
            </h3>
            <p className="text-xs text-zinc-500">{domain}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Credentials Preview */}
      <div className="p-4 space-y-3">
        {/* Username */}
        <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-medium">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">Username</p>
            <p className="text-sm text-white truncate">{username}</p>
          </div>
        </div>

        {/* Password */}
        <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <Key size={14} className="text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">Password</p>
            <p className="text-sm text-white font-mono">
              {showPassword ? password : '••••••••••••'}
            </p>
          </div>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 pt-0">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          <Check size={16} />
          {isUpdate ? 'Update' : 'Save'}
        </button>
        <button
          onClick={onNeverSave}
          className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Never save for this site"
        >
          <Ban size={16} />
        </button>
      </div>
    </div>
  );
};

export default SavePasswordPrompt;
