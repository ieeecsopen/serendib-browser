/**
 * Default values and configurations
 */

import type { DefaultPermissions } from '../types';

export const DEFAULT_HOME_URL = 'seran://newtab';

export const DEFAULT_USER_AGENT = 
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Internal URL schemes */
export const INTERNAL_URLS = {
  NEW_TAB: 'seran://newtab',
  SETTINGS: 'seran://settings',
  HISTORY: 'seran://history',
  DOWNLOADS: 'seran://downloads',
  EXTENSIONS: 'seran://extensions',
  OFFLINE: 'seran://offline',
} as const;

/** Default permission settings for all sites */
export const DEFAULT_PERMISSIONS: DefaultPermissions = {
  camera: 'ask',
  microphone: 'ask',
  location: 'ask',
  notifications: 'ask',
  'clipboard-read': 'ask',
  'clipboard-write': 'allow',
  autoplay: 'allow',
  popups: 'block',
};
