
import { Bookmark, Workspace, Tab, Container, DownloadItem, Extension } from './types';

export const INITIAL_BOOKMARKS: Bookmark[] = [
  { id: '1', title: 'News 1st', url: 'https://www.newsfirst.lk', dateAdded: Date.now() },
  { id: '2', title: 'CricInfo', url: 'https://www.espncricinfo.com', dateAdded: Date.now() },
  { id: '3', title: 'Department of Immigration', url: 'https://www.immigration.gov.lk', dateAdded: Date.now() },
  { id: '4', title: 'Sri Lanka Tourism', url: 'https://www.srilanka.travel', dateAdded: Date.now() },
];

export const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'ws-1', name: 'Personal', icon: 'User', tabIds: [] },
  { id: 'ws-2', name: 'Work', icon: 'Briefcase', tabIds: [] },
  { id: 'ws-3', name: 'News', icon: 'Newspaper', tabIds: [] },
];

export const INITIAL_CONTAINERS: Container[] = [
  { id: 'cont-default', name: 'Personal', color: '#3b82f6', icon: 'User', isDisposable: false }, // Blue
  { id: 'cont-work', name: 'Work', color: '#f97316', icon: 'Briefcase', isDisposable: false }, // Orange
  { id: 'cont-banking', name: 'Banking', color: '#22c55e', icon: 'DollarSign', isDisposable: false }, // Green
  { id: 'cont-shopping', name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag', isDisposable: false }, // Pink
];

export const MOCK_DOWNLOADS: DownloadItem[] = [
  { id: 'd1', filename: 'serendib-setup.exe', url: 'https://serendib.browser/download', totalBytes: 85000000, receivedBytes: 85000000, state: 'completed', startTime: Date.now() - 100000, endTime: Date.now() - 5000 },
  { id: 'd2', filename: 'financial_report_Q1.pdf', url: 'https://finance.lk/reports', totalBytes: 4500000, receivedBytes: 2100000, state: 'progressing', startTime: Date.now() - 2000 },
  { id: 'd3', filename: 'image_pack.zip', url: 'https://images.com/pack', totalBytes: 120000000, receivedBytes: 0, state: 'interrupted', startTime: Date.now() - 500000 },
];

export const MOCK_EXTENSIONS: Extension[] = [
  { id: 'ext1', name: 'uBlock Origin', description: 'Finally, an efficient blocker. Easy on CPU and memory.', version: '1.52.0', icon: 'Shield', enabled: true, permissions: ['Read and change all your data on all websites'] },
  { id: 'ext2', name: 'Grammarly', description: 'AI Writing Assistant', version: '14.1102.0', icon: 'PenTool', enabled: true, permissions: ['Read and change all your data on all websites'] },
  { id: 'ext3', name: 'React Developer Tools', description: 'Adds React debugging tools to the Developer Tools.', version: '4.28.0', icon: 'Code', enabled: false, permissions: ['Read your browsing history'] },
];

export const DEFAULT_HOME_URL = 'serendib://newtab';

export const SEARCH_ENGINES = {
  Google: 'https://www.google.com/search?q=',
  Bing: 'https://www.bing.com/search?q=',
  DuckDuckGo: 'https://duckduckgo.com/?q=',
};

export const MOCK_SEARCH_RESULTS = [
  { title: "Sri Lanka - Wikipedia", url: "https://en.wikipedia.org/wiki/Sri_Lanka", snippet: "Sri Lanka, officially the Democratic Socialist Republic of Sri Lanka, is an island country in South Asia, located in the Indian Ocean southwest of the Bay of Bengal." },
  { title: "Sri Lanka Tourism - The Official Website", url: "https://www.srilanka.travel", snippet: "Welcome to Sri Lanka. See what's waiting for you. Travel info, attractions, culture, and more." },
  { title: "News 1st: Sri Lanka News", url: "https://www.newsfirst.lk", snippet: "Get the latest breaking news and top stories from Sri Lanka and around the world." },
];
