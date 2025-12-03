/**
 * VPN/Proxy Service
 * 
 * Manages proxy configurations and connections for the browser.
 */

import type { ProxyConfig, ProxySettings, ProxyStatus, ProxyPreset, ProxyProtocol } from '../types/proxy';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'seran-proxy-settings';

const DEFAULT_PROXY_SETTINGS: ProxySettings = {
  enabled: false,
  activeProxyId: null,
  configs: [],
  autoConnect: false,
  proxyDns: true,
  showInToolbar: true,
};

/** Built-in proxy presets (example free proxies - in production, use reliable sources) */
export const PROXY_PRESETS: ProxyPreset[] = [
  {
    id: 'preset-us-1',
    name: 'United States',
    description: 'Fast US proxy server',
    countryCode: 'US',
    protocol: 'https',
    host: 'us-proxy.example.com',
    port: 8080,
    speedRating: 4,
    isPremium: false,
  },
  {
    id: 'preset-uk-1',
    name: 'United Kingdom',
    description: 'UK proxy server',
    countryCode: 'GB',
    protocol: 'https',
    host: 'uk-proxy.example.com',
    port: 8080,
    speedRating: 4,
    isPremium: false,
  },
  {
    id: 'preset-de-1',
    name: 'Germany',
    description: 'German proxy server',
    countryCode: 'DE',
    protocol: 'https',
    host: 'de-proxy.example.com',
    port: 8080,
    speedRating: 5,
    isPremium: false,
  },
  {
    id: 'preset-jp-1',
    name: 'Japan',
    description: 'Japanese proxy server',
    countryCode: 'JP',
    protocol: 'socks5',
    host: 'jp-proxy.example.com',
    port: 1080,
    speedRating: 3,
    isPremium: true,
  },
  {
    id: 'preset-sg-1',
    name: 'Singapore',
    description: 'Singapore proxy server',
    countryCode: 'SG',
    protocol: 'https',
    host: 'sg-proxy.example.com',
    port: 8080,
    speedRating: 4,
    isPremium: true,
  },
];

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Load proxy settings from localStorage
 */
export function loadProxySettings(): ProxySettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PROXY_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('[Proxy] Failed to load settings:', error);
  }
  return { ...DEFAULT_PROXY_SETTINGS };
}

/**
 * Save proxy settings to localStorage
 */
export function saveProxySettings(settings: ProxySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Proxy] Failed to save settings:', error);
  }
}

// ============================================================================
// Proxy Configuration Functions
// ============================================================================

/**
 * Generate a unique proxy config ID
 */
function generateProxyId(): string {
  return `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new proxy configuration
 */
export function createProxyConfig(
  name: string,
  protocol: ProxyProtocol,
  host: string,
  port: number,
  options?: {
    username?: string;
    password?: string;
    countryCode?: string;
    bypassList?: string[];
  }
): ProxyConfig {
  return {
    id: generateProxyId(),
    name,
    protocol,
    host,
    port,
    username: options?.username,
    password: options?.password,
    countryCode: options?.countryCode,
    bypassList: options?.bypassList || ['localhost', '127.0.0.1', '*.local'],
    requiresAuth: !!(options?.username && options?.password),
    enabled: true,
  };
}

/**
 * Add a proxy configuration
 */
export function addProxyConfig(config: ProxyConfig): ProxySettings {
  const settings = loadProxySettings();
  settings.configs.push(config);
  saveProxySettings(settings);
  return settings;
}

/**
 * Update a proxy configuration
 */
export function updateProxyConfig(id: string, updates: Partial<ProxyConfig>): ProxySettings {
  const settings = loadProxySettings();
  const index = settings.configs.findIndex(c => c.id === id);
  if (index !== -1) {
    settings.configs[index] = { ...settings.configs[index], ...updates };
    saveProxySettings(settings);
  }
  return settings;
}

/**
 * Delete a proxy configuration
 */
export function deleteProxyConfig(id: string): ProxySettings {
  const settings = loadProxySettings();
  settings.configs = settings.configs.filter(c => c.id !== id);
  if (settings.activeProxyId === id) {
    settings.activeProxyId = null;
    settings.enabled = false;
  }
  saveProxySettings(settings);
  return settings;
}

/**
 * Create proxy config from preset
 */
export function createFromPreset(preset: ProxyPreset): ProxyConfig {
  return createProxyConfig(preset.name, preset.protocol, preset.host, preset.port, {
    countryCode: preset.countryCode,
  });
}

// ============================================================================
// Proxy Connection Functions
// ============================================================================

/** Current proxy status */
let currentStatus: ProxyStatus = {
  isConnected: false,
  currentProxy: null,
};

/**
 * Get current proxy status
 */
export function getProxyStatus(): ProxyStatus {
  return { ...currentStatus };
}

/**
 * Build proxy URL for Electron session
 */
export function buildProxyUrl(config: ProxyConfig): string {
  const { protocol, host, port, username, password } = config;
  
  if (username && password) {
    return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }
  
  return `${protocol}://${host}:${port}`;
}

/**
 * Build proxy rules string for Electron
 */
export function buildProxyRules(config: ProxyConfig): string {
  const { protocol, host, port } = config;
  
  switch (protocol) {
    case 'socks4':
      return `socks4://${host}:${port}`;
    case 'socks5':
      return `socks5://${host}:${port}`;
    case 'https':
      return `https=${host}:${port};http=${host}:${port}`;
    case 'http':
      return `http=${host}:${port}`;
    case 'direct':
      return 'direct://';
    default:
      return `http=${host}:${port}`;
  }
}

/**
 * Connect to a proxy (via Electron IPC)
 */
export async function connectProxy(configId: string): Promise<{ success: boolean; error?: string }> {
  const settings = loadProxySettings();
  const config = settings.configs.find(c => c.id === configId);
  
  if (!config) {
    return { success: false, error: 'Proxy configuration not found' };
  }

  try {
    const electron = (window as any).electron;
    
    if (electron?.proxy?.connect) {
      const proxyRules = buildProxyRules(config);
      const bypassRules = config.bypassList?.join(',') || '';
      
      const result = await electron.proxy.connect(proxyRules, bypassRules);
      
      if (result.success) {
        currentStatus = {
          isConnected: true,
          currentProxy: config,
          connectionTime: Date.now(),
        };
        
        // Update settings
        settings.enabled = true;
        settings.activeProxyId = configId;
        updateProxyConfig(configId, { lastStatus: 'connected', lastConnected: Date.now() });
        saveProxySettings(settings);
        
        return { success: true };
      } else {
        updateProxyConfig(configId, { lastStatus: 'error', lastError: result.error });
        return { success: false, error: result.error };
      }
    }
    
    // Fallback for non-Electron environment (demo mode)
    console.log('[Proxy] Demo mode - simulating connection to:', config.name);
    currentStatus = {
      isConnected: true,
      currentProxy: config,
      connectionTime: Date.now(),
    };
    
    settings.enabled = true;
    settings.activeProxyId = configId;
    saveProxySettings(settings);
    
    return { success: true };
  } catch (error: any) {
    updateProxyConfig(configId, { lastStatus: 'error', lastError: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect from current proxy
 */
export async function disconnectProxy(): Promise<{ success: boolean; error?: string }> {
  try {
    const electron = (window as any).electron;
    
    if (electron?.proxy?.disconnect) {
      const result = await electron.proxy.disconnect();
      
      if (result.success) {
        const settings = loadProxySettings();
        if (settings.activeProxyId) {
          updateProxyConfig(settings.activeProxyId, { lastStatus: 'disconnected' });
        }
        
        currentStatus = {
          isConnected: false,
          currentProxy: null,
        };
        
        settings.enabled = false;
        settings.activeProxyId = null;
        saveProxySettings(settings);
        
        return { success: true };
      }
      return { success: false, error: result.error };
    }
    
    // Fallback for non-Electron environment
    currentStatus = {
      isConnected: false,
      currentProxy: null,
    };
    
    const settings = loadProxySettings();
    settings.enabled = false;
    settings.activeProxyId = null;
    saveProxySettings(settings);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Test proxy connection
 */
export async function testProxyConnection(config: ProxyConfig): Promise<{ success: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const electron = (window as any).electron;
    
    if (electron?.proxy?.test) {
      const proxyRules = buildProxyRules(config);
      const result = await electron.proxy.test(proxyRules);
      
      if (result.success) {
        return { 
          success: true, 
          latency: result.latency || (Date.now() - startTime)
        };
      }
      return { success: false, error: result.error };
    }
    
    // Fallback - simulate test
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    return { success: true, latency: Date.now() - startTime };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get current external IP address
 */
export async function getCurrentIp(): Promise<{ ip?: string; country?: string; error?: string }> {
  try {
    // Use a public IP API
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return { ip: data.ip };
    }
    return { error: 'Failed to fetch IP' };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Format country code to flag emoji
 */
export function countryCodeToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

/**
 * Get country name from code
 */
export function getCountryName(countryCode: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    JP: 'Japan',
    SG: 'Singapore',
    AU: 'Australia',
    CA: 'Canada',
    NL: 'Netherlands',
    CH: 'Switzerland',
    LK: 'Sri Lanka',
  };
  
  return countries[countryCode?.toUpperCase()] || countryCode || 'Unknown';
}
