/**
 * VPN/Proxy Type Definitions
 */

/** Proxy protocol types */
export type ProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5' | 'direct';

/** Proxy configuration */
export interface ProxyConfig {
  id: string;
  name: string;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  username?: string;
  password?: string;
  /** Country code for display (optional) */
  countryCode?: string;
  /** Whether this proxy requires authentication */
  requiresAuth: boolean;
  /** Bypass list - URLs that should not use the proxy */
  bypassList?: string[];
  /** Whether this config is enabled */
  enabled: boolean;
  /** Last connection status */
  lastStatus?: 'connected' | 'disconnected' | 'error';
  /** Last error message */
  lastError?: string;
  /** Timestamp of last successful connection */
  lastConnected?: number;
}

/** Built-in proxy presets (free proxy servers) */
export interface ProxyPreset {
  id: string;
  name: string;
  description: string;
  countryCode: string;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  /** Speed rating 1-5 */
  speedRating: number;
  /** Whether this preset is premium (requires subscription) */
  isPremium: boolean;
}

/** Proxy connection status */
export interface ProxyStatus {
  isConnected: boolean;
  currentProxy: ProxyConfig | null;
  connectionTime?: number;
  bytesTransferred?: number;
  /** IP address when connected via proxy */
  proxyIp?: string;
  /** Real IP address (before proxy) */
  realIp?: string;
}

/** Proxy settings for the browser */
export interface ProxySettings {
  /** Whether proxy is globally enabled */
  enabled: boolean;
  /** Active proxy configuration ID */
  activeProxyId: string | null;
  /** All saved proxy configurations */
  configs: ProxyConfig[];
  /** Auto-connect on startup */
  autoConnect: boolean;
  /** DNS over proxy */
  proxyDns: boolean;
  /** Show proxy status in toolbar */
  showInToolbar: boolean;
}
