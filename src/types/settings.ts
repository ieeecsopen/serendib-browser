/**
 * Settings-related type definitions
 */

/** Theme modes */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
  SERENDIB = 'serendib',
  MIDNIGHT = 'midnight',
  FOREST = 'forest',
  ROSE = 'rose',
  SUNSET = 'sunset',
  NORD = 'nord'
}

/** Supported languages */
export type Language = 'en-US' | 'si-LK' | 'ta-LK';

/** Search engine options */
export type SearchEngine = 'Google' | 'Bing' | 'DuckDuckGo';

/** Accent color options */
export type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'gold';

/** Browser settings configuration */
export interface BrowserSettings {
  // General
  homeUrl: string;
  searchEngine: SearchEngine;
  theme: ThemeMode;
  language: Language;
  
  // UI Preferences
  verticalTabs: boolean;
  accentColor: AccentColor;
  
  // Privacy & Security
  enableAdBlock: boolean;
  privacyMode: boolean;
  
  // Performance
  dataSaver: boolean;
  memorySaver: boolean;
  lowSpecMode: boolean;
}
