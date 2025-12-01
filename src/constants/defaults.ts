/**
 * Default values and configurations
 */

export const DEFAULT_HOME_URL = 'serendib://newtab';

export const DEFAULT_USER_AGENT = 
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Internal URL schemes */
export const INTERNAL_URLS = {
  NEW_TAB: 'serendib://newtab',
  SETTINGS: 'serendib://settings',
  HISTORY: 'serendib://history',
  DOWNLOADS: 'serendib://downloads',
  EXTENSIONS: 'serendib://extensions',
  OFFLINE: 'serendib://offline',
} as const;
