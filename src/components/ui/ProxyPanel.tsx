/**
 * VPN/Proxy Panel Component
 * 
 * UI for managing proxy connections and configurations.
 */

import React, { useState, useEffect } from 'react';
import type { ProxyConfig, ProxySettings, ProxyStatus, ProxyPreset } from '../../types/proxy';
import {
  loadProxySettings,
  saveProxySettings,
  createProxyConfig,
  addProxyConfig,
  deleteProxyConfig,
  connectProxy,
  disconnectProxy,
  testProxyConnection,
  getCurrentIp,
  countryCodeToFlag,
  getCountryName,
  PROXY_PRESETS,
  createFromPreset,
  getProxyStatus,
} from '../../services/proxy';
import {
  Shield, ShieldCheck, ShieldOff, Globe, Plus, Trash2, 
  Loader2, Check, X, Wifi, WifiOff, Settings, ChevronRight,
  ChevronDown, Zap, Clock, Server, Lock, Unlock
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ProxyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ProxyPanel: React.FC<ProxyPanelProps> = ({
  isOpen,
  onClose,
  onNotification,
}) => {
  // State
  const [settings, setSettings] = useState<ProxySettings>(loadProxySettings);
  const [status, setStatus] = useState<ProxyStatus>(getProxyStatus);
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);

  // Form state for new proxy
  const [newProxy, setNewProxy] = useState({
    name: '',
    protocol: 'https' as const,
    host: '',
    port: 8080,
    username: '',
    password: '',
    countryCode: '',
  });

  // Fetch current IP on mount
  useEffect(() => {
    if (isOpen) {
      getCurrentIp().then(result => {
        if (result.ip) setCurrentIp(result.ip);
      });
    }
  }, [isOpen, status.isConnected]);

  // Handlers
  const handleConnect = async (configId: string) => {
    setIsConnecting(true);
    const result = await connectProxy(configId);
    setIsConnecting(false);
    
    if (result.success) {
      setStatus(getProxyStatus());
      setSettings(loadProxySettings());
      onNotification?.('Proxy Connected', 'Your connection is now routed through the proxy.', 'success');
      // Refresh IP
      const ipResult = await getCurrentIp();
      if (ipResult.ip) setCurrentIp(ipResult.ip);
    } else {
      onNotification?.('Connection Failed', result.error || 'Could not connect to proxy.', 'error');
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    const result = await disconnectProxy();
    setIsConnecting(false);
    
    if (result.success) {
      setStatus(getProxyStatus());
      setSettings(loadProxySettings());
      onNotification?.('Proxy Disconnected', 'Direct connection restored.', 'info');
      // Refresh IP
      const ipResult = await getCurrentIp();
      if (ipResult.ip) setCurrentIp(ipResult.ip);
    }
  };

  const handleTest = async (config: ProxyConfig) => {
    setIsTesting(config.id);
    const result = await testProxyConnection(config);
    setIsTesting(null);
    
    if (result.success) {
      onNotification?.('Test Successful', `Latency: ${result.latency}ms`, 'success');
    } else {
      onNotification?.('Test Failed', result.error || 'Could not connect.', 'error');
    }
  };

  const handleAddProxy = () => {
    if (!newProxy.name || !newProxy.host || !newProxy.port) {
      onNotification?.('Invalid Input', 'Please fill in all required fields.', 'warning');
      return;
    }

    const config = createProxyConfig(
      newProxy.name,
      newProxy.protocol,
      newProxy.host,
      newProxy.port,
      {
        username: newProxy.username || undefined,
        password: newProxy.password || undefined,
        countryCode: newProxy.countryCode || undefined,
      }
    );

    addProxyConfig(config);
    setSettings(loadProxySettings());
    setShowAddForm(false);
    setNewProxy({
      name: '',
      protocol: 'https',
      host: '',
      port: 8080,
      username: '',
      password: '',
      countryCode: '',
    });
    onNotification?.('Proxy Added', `${config.name} has been saved.`, 'success');
  };

  const handleAddFromPreset = (preset: ProxyPreset) => {
    const config = createFromPreset(preset);
    addProxyConfig(config);
    setSettings(loadProxySettings());
    setShowPresets(false);
    onNotification?.('Proxy Added', `${preset.name} has been added.`, 'success');
  };

  const handleDeleteProxy = (id: string) => {
    deleteProxyConfig(id);
    setSettings(loadProxySettings());
    onNotification?.('Proxy Removed', 'Configuration deleted.', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-[500px] max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className={`p-2 rounded-xl ${status.isConnected ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}
            >
              {status.isConnected ? <ShieldCheck size={20} /> : <Shield size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                VPN / Proxy
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {status.isConnected 
                  ? `Connected to ${status.currentProxy?.name}`
                  : 'Not connected'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Card */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-blue-400" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Your IP Address
                </span>
              </div>
              {status.isConnected && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                  Protected
                </span>
              )}
            </div>
            <p className="text-xl font-mono" style={{ color: 'var(--text-primary)' }}>
              {currentIp || 'Detecting...'}
            </p>
            {status.isConnected && status.currentProxy?.countryCode && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {countryCodeToFlag(status.currentProxy.countryCode)}{' '}
                {getCountryName(status.currentProxy.countryCode)}
              </p>
            )}
          </div>

          {/* Quick Connect/Disconnect */}
          {status.isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isConnecting}
              className="w-full mt-3 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              {isConnecting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <WifiOff size={16} />
              )}
              Disconnect
            </button>
          ) : settings.configs.length > 0 ? (
            <button
              onClick={() => handleConnect(settings.configs[0].id)}
              disabled={isConnecting}
              className="w-full mt-3 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              {isConnecting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Wifi size={16} />
              )}
              Quick Connect
            </button>
          ) : null}
        </div>

        {/* Proxy List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Saved Proxies
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <Zap size={12} />
                Presets
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <Plus size={12} />
                Add
              </button>
            </div>
          </div>

          {/* Presets Dropdown */}
          {showPresets && (
            <div 
              className="p-3 rounded-xl mb-3 space-y-2"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Quick Add from Presets
              </p>
              {PROXY_PRESETS.filter(p => !p.isPremium).map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleAddFromPreset(preset)}
                  className="w-full p-2 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-3 text-left"
                >
                  <span className="text-lg">{countryCodeToFlag(preset.countryCode)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preset.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {preset.protocol.toUpperCase()} • Speed: {'⚡'.repeat(preset.speedRating)}
                    </p>
                  </div>
                  <Plus size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div 
              className="p-4 rounded-xl mb-3 space-y-3"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <input
                type="text"
                placeholder="Proxy Name"
                value={newProxy.name}
                onChange={e => setNewProxy(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <div className="flex gap-2">
                <select
                  value={newProxy.protocol}
                  onChange={e => setNewProxy(p => ({ ...p, protocol: e.target.value as any }))}
                  className="px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
                <input
                  type="text"
                  placeholder="Host"
                  value={newProxy.host}
                  onChange={e => setNewProxy(p => ({ ...p, host: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <input
                  type="number"
                  placeholder="Port"
                  value={newProxy.port}
                  onChange={e => setNewProxy(p => ({ ...p, port: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Username (optional)"
                  value={newProxy.username}
                  onChange={e => setNewProxy(p => ({ ...p, username: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <input
                  type="password"
                  placeholder="Password (optional)"
                  value={newProxy.password}
                  onChange={e => setNewProxy(p => ({ ...p, password: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-700 hover:bg-zinc-600 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProxy}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Add Proxy
                </button>
              </div>
            </div>
          )}

          {/* Saved Proxy Configs */}
          {settings.configs.length === 0 ? (
            <div className="text-center py-8">
              <Server size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No proxies configured
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Add a proxy or choose from presets
              </p>
            </div>
          ) : (
            settings.configs.map(config => (
              <div
                key={config.id}
                className={`p-3 rounded-xl transition-colors ${
                  status.currentProxy?.id === config.id 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-zinc-800/50 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {config.countryCode ? countryCodeToFlag(config.countryCode) : '🌐'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {config.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {config.protocol.toUpperCase()} • {config.host}:{config.port}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {status.currentProxy?.id === config.id ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        Connected
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleTest(config)}
                          disabled={isTesting === config.id}
                          className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Test connection"
                        >
                          {isTesting === config.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Zap size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleConnect(config.id)}
                          disabled={isConnecting}
                          className="p-1.5 rounded-lg hover:bg-green-500/20 hover:text-green-400 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Connect"
                        >
                          <Wifi size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProxy(config.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-3 text-center"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {status.isConnected ? (
              <>🔒 Your connection is encrypted and private</>
            ) : (
              <>Connect to a proxy to hide your IP address</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProxyPanel;
