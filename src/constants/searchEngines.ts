/**
 * Search engine configurations
 */

import type { SearchEngine } from '../types';

export const SEARCH_ENGINE_URLS: Record<SearchEngine, string> = {
  Google: 'https://www.google.com/search?q=',
  Bing: 'https://www.bing.com/search?q=',
  DuckDuckGo: 'https://duckduckgo.com/?q=',
};

/**
 * Get the search URL for a given query
 */
export function getSearchUrl(query: string, engine: SearchEngine = 'DuckDuckGo'): string {
  return `${SEARCH_ENGINE_URLS[engine]}${encodeURIComponent(query)}`;
}
