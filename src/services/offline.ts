/**
 * Offline Page Service
 * Handles intelligent article extraction, saving pages offline,
 * and syncing across devices.
 */

import type { OfflinePage, OfflineImage, OfflineSaveOptions } from '../types/browser';

// ============================================================================
// Constants
// ============================================================================

const OFFLINE_STORAGE_KEY = 'Seran-offline-pages';
const OFFLINE_IMAGES_KEY = 'Seran-offline-images';
const DEVICE_ID_KEY = 'Seran-device-id';
const WORDS_PER_MINUTE = 200;

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

/**
 * Get or create a unique device ID
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${generateId()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}

/**
 * Calculate word count
 */
export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extract plain text from HTML
 */
export function extractTextFromHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Create excerpt from text
 */
export function createExcerpt(text: string, maxLength: number = 200): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

// ============================================================================
// Article Extraction
// ============================================================================

/**
 * Extract article metadata from HTML
 */
export interface ArticleMetadata {
  title: string;
  author?: string;
  publishedDate?: string;
  siteName?: string;
  description?: string;
  heroImage?: string;
}

/**
 * Extract metadata from a document
 */
export function extractMetadata(doc: Document): ArticleMetadata {
  const metadata: ArticleMetadata = {
    title: '',
  };

  // Title: Try various sources
  metadata.title = 
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    doc.querySelector('h1')?.textContent?.trim() ||
    doc.querySelector('title')?.textContent?.trim() ||
    'Untitled';

  // Author
  metadata.author = 
    doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
    doc.querySelector('[rel="author"]')?.textContent?.trim() ||
    doc.querySelector('.author, .byline, [itemprop="author"]')?.textContent?.trim();

  // Published date
  metadata.publishedDate = 
    doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
    doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
    doc.querySelector('meta[name="date"]')?.getAttribute('content');

  // Site name
  metadata.siteName = 
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="application-name"]')?.getAttribute('content');

  // Description
  metadata.description = 
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');

  // Hero image
  metadata.heroImage = 
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

  return metadata;
}

/**
 * Content scoring for article extraction
 */
interface ScoredElement {
  element: Element;
  score: number;
}

/**
 * Score an element for content likelihood
 */
function scoreElement(element: Element): number {
  let score = 0;
  const text = element.textContent || '';
  const textLength = text.length;
  const tagName = element.tagName.toLowerCase();

  // Positive signals
  if (tagName === 'article') score += 50;
  if (tagName === 'main') score += 30;
  if (element.id.match(/article|content|post|body|main/i)) score += 25;
  if (element.className.match(/article|content|post|body|entry|text/i)) score += 25;
  if (element.getAttribute('itemprop')?.includes('articleBody')) score += 40;

  // Text length bonus (more text = more likely to be content)
  if (textLength > 500) score += 20;
  if (textLength > 1000) score += 20;
  if (textLength > 2000) score += 15;

  // Paragraph count bonus
  const paragraphs = element.querySelectorAll('p');
  score += Math.min(paragraphs.length * 3, 30);

  // Negative signals
  if (element.id.match(/comment|sidebar|footer|header|nav|menu|ad|promo|related/i)) score -= 50;
  if (element.className.match(/comment|sidebar|footer|header|nav|menu|ad|promo|related|share|social/i)) score -= 50;
  if (tagName === 'aside' || tagName === 'nav' || tagName === 'footer' || tagName === 'header') score -= 40;

  // Link density penalty (too many links = navigation, not content)
  const links = element.querySelectorAll('a');
  const linkTextLength = Array.from(links).reduce((sum, a) => sum + (a.textContent?.length || 0), 0);
  const linkDensity = textLength > 0 ? linkTextLength / textLength : 0;
  if (linkDensity > 0.5) score -= 30;
  if (linkDensity > 0.7) score -= 30;

  return score;
}

/**
 * Extract main content from HTML document
 */
export function extractArticleContent(doc: Document): string {
  // Try semantic elements first
  const article = doc.querySelector('article');
  if (article && (article.textContent?.length || 0) > 500) {
    return cleanContent(article);
  }

  const main = doc.querySelector('main');
  if (main && (main.textContent?.length || 0) > 500) {
    return cleanContent(main);
  }

  // Score all major containers
  const candidates = doc.querySelectorAll('div, section, article, main');
  const scored: ScoredElement[] = [];

  candidates.forEach(el => {
    // Skip if too small or is a child of another candidate
    const textLength = el.textContent?.length || 0;
    if (textLength < 200) return;

    scored.push({
      element: el,
      score: scoreElement(el),
    });
  });

  // Sort by score and pick the best
  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score > 20) {
    return cleanContent(scored[0].element);
  }

  // Fallback: return body content
  return cleanContent(doc.body);
}

/**
 * Clean extracted content
 */
function cleanContent(element: Element): string {
  const clone = element.cloneNode(true) as Element;

  // Remove unwanted elements
  const removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'object', 'embed',
    'nav', 'header', 'footer', 'aside',
    '.ad', '.ads', '.advertisement', '.sponsored',
    '.comment', '.comments', '#comments',
    '.sidebar', '.widget', '.related', '.share', '.social',
    '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
    '.newsletter', '.subscribe', '.signup',
  ];

  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Clean attributes (keep only essential ones)
  const allowedAttrs = ['href', 'src', 'alt', 'title', 'class'];
  clone.querySelectorAll('*').forEach(el => {
    const attrs = Array.from(el.attributes);
    attrs.forEach(attr => {
      if (!allowedAttrs.includes(attr.name) && !attr.name.startsWith('data-')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Wrap in article with reader-friendly classes
  const wrapper = document.createElement('article');
  wrapper.className = 'prose prose-invert prose-zinc max-w-none';
  wrapper.innerHTML = clone.innerHTML;

  return wrapper.outerHTML;
}

/**
 * Extract images from content
 */
export function extractImages(doc: Document, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // Get hero image first
  const heroImage = 
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  
  if (heroImage) {
    const resolved = resolveUrl(heroImage, baseUrl);
    if (!seen.has(resolved)) {
      images.push(resolved);
      seen.add(resolved);
    }
  }

  // Get content images
  doc.querySelectorAll('article img, main img, .content img, [role="main"] img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (src) {
      const resolved = resolveUrl(src, baseUrl);
      if (!seen.has(resolved) && !src.includes('data:') && !src.includes('blank.gif')) {
        images.push(resolved);
        seen.add(resolved);
      }
    }
  });

  return images;
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

// ============================================================================
// Storage Operations
// ============================================================================

/**
 * Get all offline pages from storage
 */
export function getOfflinePages(): OfflinePage[] {
  try {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save offline pages to storage
 */
export function saveOfflinePages(pages: OfflinePage[]): void {
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(pages));
}

/**
 * Get a single offline page by ID
 */
export function getOfflinePage(id: string): OfflinePage | undefined {
  const pages = getOfflinePages();
  return pages.find(p => p.id === id);
}

/**
 * Check if a URL is saved offline
 */
export function isPageSavedOffline(url: string): boolean {
  const pages = getOfflinePages();
  return pages.some(p => p.url === url);
}

/**
 * Update last accessed timestamp
 */
export function updateLastAccessed(id: string): void {
  const pages = getOfflinePages();
  const index = pages.findIndex(p => p.id === id);
  if (index !== -1) {
    pages[index].lastAccessedAt = Date.now();
    saveOfflinePages(pages);
  }
}

/**
 * Add or update an offline page
 */
export function saveOfflinePage(page: OfflinePage): void {
  const pages = getOfflinePages();
  const existingIndex = pages.findIndex(p => p.url === page.url);
  
  if (existingIndex >= 0) {
    // Update existing
    pages[existingIndex] = { ...pages[existingIndex], ...page, savedAt: Date.now() };
  } else {
    // Add new
    pages.unshift(page);
  }
  
  saveOfflinePages(pages);
}

/**
 * Delete an offline page
 */
export function deleteOfflinePage(id: string): void {
  const pages = getOfflinePages();
  const filtered = pages.filter(p => p.id !== id);
  saveOfflinePages(filtered);
}

/**
 * Add tags to a page
 */
export function addTagsToPage(id: string, tags: string[]): void {
  const pages = getOfflinePages();
  const page = pages.find(p => p.id === id);
  if (page) {
    page.tags = [...new Set([...(page.tags || []), ...tags])];
    saveOfflinePages(pages);
  }
}

/**
 * Remove tag from a page
 */
export function removeTagFromPage(id: string, tag: string): void {
  const pages = getOfflinePages();
  const page = pages.find(p => p.id === id);
  if (page && page.tags) {
    page.tags = page.tags.filter(t => t !== tag);
    saveOfflinePages(pages);
  }
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const pages = getOfflinePages();
  const tagSet = new Set<string>();
  pages.forEach(p => p.tags?.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

/**
 * Search offline pages
 */
export function searchOfflinePages(query: string): OfflinePage[] {
  const pages = getOfflinePages();
  const lowerQuery = query.toLowerCase();
  
  return pages.filter(p => 
    p.title.toLowerCase().includes(lowerQuery) ||
    p.excerpt.toLowerCase().includes(lowerQuery) ||
    p.url.toLowerCase().includes(lowerQuery) ||
    p.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
    p.author?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get pages by tag
 */
export function getPagesByTag(tag: string): OfflinePage[] {
  const pages = getOfflinePages();
  return pages.filter(p => p.tags?.includes(tag));
}

/**
 * Get recently accessed pages
 */
export function getRecentPages(limit: number = 10): OfflinePage[] {
  const pages = getOfflinePages();
  return pages
    .sort((a, b) => (b.lastAccessedAt || b.savedAt) - (a.lastAccessedAt || a.savedAt))
    .slice(0, limit);
}

// ============================================================================
// Page Saving
// ============================================================================

/**
 * Create an offline page from HTML content
 */
export function createOfflinePageFromHtml(
  url: string,
  html: string,
  options: OfflineSaveOptions = {}
): OfflinePage {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract metadata
  const metadata = extractMetadata(doc);
  
  // Extract content
  const content = options.useReaderMode !== false 
    ? extractArticleContent(doc)
    : doc.body.innerHTML;
  
  // Calculate metrics
  const plainText = extractTextFromHtml(content);
  const wordCount = calculateWordCount(plainText);
  const readingTime = calculateReadingTime(plainText);
  const excerpt = metadata.description || createExcerpt(plainText);
  
  // Calculate approximate size
  const sizeBytes = new Blob([content]).size;
  
  const page: OfflinePage = {
    id: generateId(),
    title: metadata.title,
    url,
    excerpt,
    content,
    savedAt: Date.now(),
    synced: false,
    size: formatBytes(sizeBytes),
    author: metadata.author,
    publishedDate: metadata.publishedDate,
    siteName: metadata.siteName,
    heroImage: metadata.heroImage,
    readingTime,
    wordCount,
    tags: options.tags || [],
    syncStatus: 'local-only',
    deviceId: getDeviceId(),
  };
  
  return page;
}

/**
 * Save page from URL (to be called from main process via IPC)
 * This is a placeholder - actual fetching happens in Electron main process
 */
export interface SavePageRequest {
  url: string;
  options: OfflineSaveOptions;
}

export interface SavePageResult {
  success: boolean;
  page?: OfflinePage;
  error?: string;
}

// ============================================================================
// Sync Operations (Placeholder for future implementation)
// ============================================================================

export interface SyncConfig {
  enabled: boolean;
  provider: 'local-network' | 'cloud' | 'webdav';
  endpoint?: string;
  encryptData: boolean;
  syncImages: boolean;
  autoSync: boolean;
  syncIntervalMinutes: number;
}

export interface SyncStatus {
  lastSyncAt?: number;
  pendingUpload: number;
  pendingDownload: number;
  issyncing: boolean;
  error?: string;
}

/**
 * Get sync configuration
 */
export function getSyncConfig(): SyncConfig | null {
  try {
    const data = localStorage.getItem('Seran-sync-config');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Save sync configuration
 */
export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem('Seran-sync-config', JSON.stringify(config));
}

/**
 * Get pages that need syncing
 */
export function getPendingSyncPages(): OfflinePage[] {
  const pages = getOfflinePages();
  return pages.filter(p => p.syncStatus === 'pending' || !p.synced);
}

/**
 * Mark page as synced
 */
export function markPageSynced(id: string): void {
  const pages = getOfflinePages();
  const page = pages.find(p => p.id === id);
  if (page) {
    page.synced = true;
    page.syncStatus = 'synced';
    saveOfflinePages(pages);
  }
}

/**
 * Export pages for sharing
 */
export function exportPagesAsJson(pageIds: string[]): string {
  const pages = getOfflinePages();
  const toExport = pages.filter(p => pageIds.includes(p.id));
  return JSON.stringify({
    version: '1.0.0',
    exportedAt: Date.now(),
    deviceId: getDeviceId(),
    pages: toExport,
  }, null, 2);
}

/**
 * Import pages from JSON
 */
export function importPagesFromJson(json: string): { imported: number; skipped: number } {
  try {
    const data = JSON.parse(json);
    const pages = getOfflinePages();
    const existingUrls = new Set(pages.map(p => p.url));
    
    let imported = 0;
    let skipped = 0;
    
    for (const page of data.pages) {
      if (existingUrls.has(page.url)) {
        skipped++;
      } else {
        pages.unshift({
          ...page,
          id: generateId(), // Generate new ID
          syncStatus: 'local-only',
          deviceId: getDeviceId(),
        });
        imported++;
      }
    }
    
    saveOfflinePages(pages);
    return { imported, skipped };
  } catch {
    return { imported: 0, skipped: 0 };
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  totalPages: number;
  totalSize: string;
  syncedPages: number;
  localOnlyPages: number;
} {
  const pages = getOfflinePages();
  const data = localStorage.getItem(OFFLINE_STORAGE_KEY) || '';
  
  return {
    totalPages: pages.length,
    totalSize: formatBytes(new Blob([data]).size),
    syncedPages: pages.filter(p => p.synced).length,
    localOnlyPages: pages.filter(p => !p.synced).length,
  };
}
