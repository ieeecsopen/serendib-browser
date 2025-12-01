/**
 * Password Manager Component
 * 
 * Full-page password manager with vault unlock, credential list,
 * password generator, and settings.
 */

import React, { useState, useEffect } from 'react';
import type { SavedCredential, PasswordGeneratorOptions, PasswordStrength } from '../../types/passwords';
import {
  getAllCredentials,
  saveCredential,
  updateCredential,
  deleteCredential,
  decryptPassword,
  recordUsage,
  generatePassword,
  analyzePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  searchCredentials,
  getPasswordStats,
  isVaultSetup,
  isVaultUnlocked,
  setupVault,
  unlockVault,
  lockVault,
  getVaultSettings,
  extractDomain,
} from '../../services/passwords';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  Key, Lock, Unlock, Eye, EyeOff, Copy, Trash2, Edit3, Plus,
  Search, Shield, AlertTriangle, RefreshCw, ExternalLink,
  CheckCircle, XCircle, Globe, User, Clock, Sparkles, Settings,
  ChevronRight, LogOut, Download, Upload
} from 'lucide-react';

// ============================================================================
// Sub-Components
// ============================================================================

// Vault Lock Screen
const VaultLockScreen: React.FC<{
  isSetup: boolean;
  onUnlock: (password: string) => Promise<boolean>;
  onSetup: (password: string) => Promise<boolean>;
}> = ({ isSetup, onUnlock, onSetup }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSetup) {
        const success = await onUnlock(password);
        if (!success) {
          setError('Incorrect master password');
        }
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        const success = await onSetup(password);
        if (!success) {
          setError('Failed to setup vault');
        }
      }
    } catch (err) {
      setError('An error occurred');
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-black p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-zinc-900">
            <Lock size={32} className="text-white" />
          </div>
          <CardTitle className="text-xl">
            {isSetup ? 'Unlock Password Vault' : 'Set Up Password Vault'}
          </CardTitle>
          <CardDescription>
            {isSetup
              ? 'Enter your master password to access saved credentials'
              : 'Create a master password to secure your passwords'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <div className="relative">
                <input
                  id="master-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  placeholder="Enter master password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  placeholder="Confirm master password"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <XCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isSetup ? 'Unlock' : 'Create Vault'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Password Strength Indicator
const PasswordStrengthIndicator: React.FC<{ strength: PasswordStrength }> = ({ strength }) => {
  const color = getPasswordStrengthColor(strength);
  const label = getPasswordStrengthLabel(strength);
  const width = { weak: '25%', fair: '50%', good: '75%', strong: '100%' }[strength];

  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width, backgroundColor: color }}
        />
      </div>
      <span className="text-xs" style={{ color }}>{label}</span>
    </div>
  );
};

// Password Generator Panel
const PasswordGeneratorPanel: React.FC<{
  onUsePassword: (password: string) => void;
}> = ({ onUsePassword }) => {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: true,
  });
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setPassword(generatePassword(options));
    setCopied(false);
  };

  useEffect(() => {
    generate();
  }, [options]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = analyzePasswordStrength(password);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles size={18} />
          Password Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generated Password */}
        <div className="p-4 bg-zinc-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <code className="flex-1 text-lg font-mono text-white break-all">
              {password}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
            <button
              onClick={generate}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <PasswordStrengthIndicator strength={strength} />
        </div>

        {/* Length Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Length</Label>
            <span className="text-sm text-zinc-400">{options.length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.includeUppercase}
              onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            Uppercase (A-Z)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.includeLowercase}
              onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            Lowercase (a-z)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.includeNumbers}
              onChange={(e) => setOptions({ ...options, includeNumbers: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            Numbers (0-9)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.includeSymbols}
              onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            Symbols (!@#$)
          </label>
        </div>

        <button
          onClick={() => onUsePassword(password)}
          className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Use This Password
        </button>
      </CardContent>
    </Card>
  );
};

// Credential Card
const CredentialCard: React.FC<{
  credential: SavedCredential;
  onEdit: () => void;
  onDelete: () => void;
  onCopyPassword: () => void;
  onCopyUsername: () => void;
  onVisit: () => void;
}> = ({ credential, onEdit, onDelete, onCopyPassword, onCopyUsername, onVisit }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);

  const handleShowPassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      setDecryptedPassword(null);
    } else {
      try {
        const pwd = await decryptPassword(credential);
        setDecryptedPassword(pwd);
        setShowPassword(true);
      } catch (error) {
        console.error('Failed to decrypt password');
      }
    }
  };

  return (
    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-all group">
      <div className="flex items-start gap-4">
        {/* Favicon */}
        <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden">
          {credential.favicon ? (
            <img src={credential.favicon} alt="" className="w-6 h-6" />
          ) : (
            <Globe size={20} className="text-zinc-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">
              {credential.name || credential.domain}
            </h3>
            {credential.passwordStrength && (
              <Badge
                variant={credential.passwordStrength === 'weak' ? 'destructive' : 'secondary'}
                className="text-[10px]"
              >
                {credential.passwordStrength}
              </Badge>
            )}
          </div>

          <p className="text-sm text-zinc-500 truncate mb-2">{credential.username}</p>

          {/* Password field */}
          <div className="flex items-center gap-2">
            <code className="text-sm text-zinc-400 font-mono">
              {showPassword && decryptedPassword ? decryptedPassword : '••••••••••••'}
            </code>
            <button
              onClick={handleShowPassword}
              className="p-1 text-zinc-600 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Meta */}
          {credential.lastUsedAt && (
            <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1">
              <Clock size={10} />
              Last used {new Date(credential.lastUsedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onCopyUsername}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Copy username"
          >
            <User size={16} />
          </button>
          <button
            onClick={onCopyPassword}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Copy password"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onVisit}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Visit site"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Add/Edit Credential Modal
const CredentialModal: React.FC<{
  credential?: SavedCredential;
  onSave: (url: string, username: string, password: string, name?: string) => Promise<void>;
  onClose: () => void;
}> = ({ credential, onSave, onClose }) => {
  const [url, setUrl] = useState(credential?.url || '');
  const [username, setUsername] = useState(credential?.username || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(credential?.name || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(url, username, password, name);
      onClose();
    } catch (error) {
      console.error('Failed to save credential');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {credential ? 'Edit Credential' : 'Add New Credential'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Website URL</Label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Name (optional)</Label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              placeholder="My Account"
            />
          </div>

          <div className="space-y-2">
            <Label>Username / Email</Label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              placeholder="username@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showGenerator ? 'Hide Generator' : 'Generate Password'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 pr-10"
                placeholder={credential ? '(unchanged)' : 'Enter password'}
                required={!credential}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && <PasswordStrengthIndicator strength={analyzePasswordStrength(password)} />}
          </div>

          {showGenerator && (
            <div className="border border-zinc-800 rounded-lg p-4">
              <PasswordGeneratorPanel onUsePassword={setPassword} />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface PasswordManagerPageProps {
  onNavigate: (url: string) => void;
}

export const PasswordManagerPage: React.FC<PasswordManagerPageProps> = ({ onNavigate }) => {
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<SavedCredential | null>(null);
  const [stats, setStats] = useState<{ total: number; weak: number; reused: number; old: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'passwords' | 'generator' | 'settings'>('passwords');

  // Check vault status on mount
  useEffect(() => {
    setIsSetup(isVaultSetup());
    setIsUnlocked(isVaultUnlocked());
  }, []);

  // Load credentials when unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadCredentials();
      loadStats();
    }
  }, [isUnlocked]);

  const loadCredentials = async () => {
    const creds = await getAllCredentials();
    setCredentials(creds);
  };

  const loadStats = async () => {
    const s = await getPasswordStats();
    setStats(s);
  };

  const handleUnlock = async (password: string): Promise<boolean> => {
    const success = await unlockVault(password);
    if (success) {
      setIsUnlocked(true);
    }
    return success;
  };

  const handleSetup = async (password: string): Promise<boolean> => {
    const success = await setupVault(password);
    if (success) {
      setIsSetup(true);
      setIsUnlocked(true);
    }
    return success;
  };

  const handleLock = () => {
    lockVault();
    setIsUnlocked(false);
    setCredentials([]);
  };

  const handleSaveCredential = async (url: string, username: string, password: string, name?: string) => {
    if (editingCredential) {
      await updateCredential(editingCredential.id, { username, password, name });
    } else {
      await saveCredential(url, username, password, { name });
    }
    await loadCredentials();
    await loadStats();
    setEditingCredential(null);
  };

  const handleDeleteCredential = async (id: string) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      await deleteCredential(id);
      await loadCredentials();
      await loadStats();
    }
  };

  const handleCopyPassword = async (credential: SavedCredential) => {
    try {
      const pwd = await decryptPassword(credential);
      await navigator.clipboard.writeText(pwd);
      await recordUsage(credential.id);
    } catch (error) {
      console.error('Failed to copy password');
    }
  };

  const handleCopyUsername = async (credential: SavedCredential) => {
    await navigator.clipboard.writeText(credential.username);
  };

  // Show lock screen if not unlocked
  if (!isUnlocked) {
    return (
      <VaultLockScreen
        isSetup={isSetup}
        onUnlock={handleUnlock}
        onSetup={handleSetup}
      />
    );
  }

  const filteredCredentials = searchQuery
    ? searchCredentials(credentials, searchQuery)
    : credentials;

  return (
    <div className="flex-1 bg-black flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-900 text-white">
              <Key size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Passwords</h1>
              <p className="text-xs text-zinc-500">{stats?.total || 0} saved</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab('passwords')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
              activeTab === 'passwords' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Lock size={18} />
            <span>All Passwords</span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
              activeTab === 'generator' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles size={18} />
            <span>Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
              activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Stats */}
        {stats && (
          <div className="p-4 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-2 text-center">
              {stats.weak > 0 && (
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <p className="text-lg font-bold text-red-400">{stats.weak}</p>
                  <p className="text-[10px] text-red-400/70">Weak</p>
                </div>
              )}
              {stats.reused > 0 && (
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <p className="text-lg font-bold text-amber-400">{stats.reused}</p>
                  <p className="text-[10px] text-amber-400/70">Reused</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lock Button */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={handleLock}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Lock Vault
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeTab === 'passwords' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">All Passwords</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  <Plus size={16} />
                  Add New
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search passwords..."
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Credentials List */}
              {filteredCredentials.length === 0 ? (
                <div className="text-center py-16">
                  <Key size={48} className="mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-500">
                    {searchQuery ? 'No passwords match your search' : 'No passwords saved yet'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 text-blue-400 hover:text-blue-300"
                    >
                      Add your first password
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCredentials.map((credential) => (
                    <CredentialCard
                      key={credential.id}
                      credential={credential}
                      onEdit={() => setEditingCredential(credential)}
                      onDelete={() => handleDeleteCredential(credential.id)}
                      onCopyPassword={() => handleCopyPassword(credential)}
                      onCopyUsername={() => handleCopyUsername(credential)}
                      onVisit={() => onNavigate(credential.url)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'generator' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Password Generator</h2>
              <PasswordGeneratorPanel onUsePassword={(pwd) => navigator.clipboard.writeText(pwd)} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Password Manager Settings</h2>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Autofill</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Auto-save passwords</p>
                      <p className="text-sm text-zinc-500">Prompt to save new passwords</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Auto-fill credentials</p>
                      <p className="text-sm text-zinc-500">Automatically fill login forms</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Lock timeout</p>
                      <p className="text-sm text-zinc-500">Auto-lock after inactivity</p>
                    </div>
                    <select className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white">
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="0">Never</option>
                    </select>
                  </div>
                  <Separator />
                  <button className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm">
                    <AlertTriangle size={16} />
                    Change Master Password
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import / Export</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors">
                    <Upload size={16} />
                    Import
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors">
                    <Download size={16} />
                    Export
                  </button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingCredential) && (
        <CredentialModal
          credential={editingCredential || undefined}
          onSave={handleSaveCredential}
          onClose={() => {
            setShowAddModal(false);
            setEditingCredential(null);
          }}
        />
      )}
    </div>
  );
};

export default PasswordManagerPage;
