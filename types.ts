
export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  history: string[]; // Back stack
  historyIndex: number;
  workspaceId: string;
  containerId: string; // Context isolation
}

export interface Container {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDisposable: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  tabIds: string[];
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  dateAdded: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: number;
}

export interface OfflinePage {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string; // HTML content
  savedAt: number;
  synced: boolean;
  size: string; // e.g. "1.2 MB"
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'interrupted' | 'cancelled';
  startTime: number;
  endTime?: number;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  enabled: boolean;
  permissions: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
  SERENDIB = 'serendib' // Custom Sri Lankan theme
}

export interface BrowserSettings {
  homeUrl: string;
  searchEngine: 'Google' | 'Bing' | 'DuckDuckGo';
  theme: ThemeMode;
  enableAdBlock: boolean;
  privacyMode: boolean; // Incognito
  
  // New Settings
  language: 'en-US' | 'si-LK' | 'ta-LK';
  verticalTabs: boolean;
  accentColor: 'blue' | 'green' | 'purple' | 'orange' | 'gold';
  dataSaver: boolean;
  memorySaver: boolean;
  lowSpecMode: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
