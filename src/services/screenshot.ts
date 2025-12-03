/**
 * Screenshot/Screen Capture Service
 * 
 * Handles capturing screenshots of web pages with various modes:
 * - Visible area
 * - Full page
 * - Selection
 * - Element
 */

import type { 
  ScreenshotOptions, 
  ScreenshotResult, 
  ScreenshotFormat,
  ScreenshotMode,
  SavedScreenshot,
  ScreenshotSelection,
} from '../types/screenshot';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'seran-screenshots';
const MAX_STORED_SCREENSHOTS = 50;

const DEFAULT_OPTIONS: ScreenshotOptions = {
  mode: 'visible',
  format: 'png',
  quality: 92,
  includeCursor: false,
  delay: 0,
  scaleFactor: 1,
};

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Generate unique screenshot ID
 */
function generateScreenshotId(): string {
  return `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load saved screenshots from localStorage
 */
export function loadSavedScreenshots(): SavedScreenshot[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('[Screenshot] Failed to load saved screenshots:', error);
  }
  return [];
}

/**
 * Save screenshots to localStorage
 */
function saveScreenshotsToStorage(screenshots: SavedScreenshot[]): void {
  try {
    // Keep only the most recent screenshots
    const toSave = screenshots.slice(0, MAX_STORED_SCREENSHOTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('[Screenshot] Failed to save screenshots:', error);
  }
}

/**
 * Save a screenshot
 */
export function saveScreenshot(
  result: ScreenshotResult,
  options: ScreenshotOptions
): SavedScreenshot | null {
  if (!result.success || !result.dataUrl) {
    return null;
  }

  const saved: SavedScreenshot = {
    id: generateScreenshotId(),
    dataUrl: result.dataUrl,
    sourceUrl: result.sourceUrl || '',
    pageTitle: result.pageTitle || 'Untitled',
    capturedAt: result.timestamp,
    width: result.width || 0,
    height: result.height || 0,
    size: result.size || 0,
    format: options.format,
    mode: options.mode,
  };

  const screenshots = loadSavedScreenshots();
  screenshots.unshift(saved);
  saveScreenshotsToStorage(screenshots);

  return saved;
}

/**
 * Delete a saved screenshot
 */
export function deleteScreenshot(id: string): void {
  const screenshots = loadSavedScreenshots();
  const filtered = screenshots.filter(s => s.id !== id);
  saveScreenshotsToStorage(filtered);
}

/**
 * Clear all saved screenshots
 */
export function clearAllScreenshots(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================================
// Capture Functions
// ============================================================================

/**
 * Capture visible area screenshot
 */
export async function captureVisibleArea(
  options: Partial<ScreenshotOptions> = {}
): Promise<ScreenshotResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options, mode: 'visible' as ScreenshotMode };
  
  try {
    const electron = (window as any).electron;
    
    if (electron?.screenshot?.captureVisible) {
      const result = await electron.screenshot.captureVisible(opts);
      return {
        ...result,
        timestamp: Date.now(),
      };
    }

    // Fallback: Use webview's capturePage (if available)
    const webview = (window as any).__activeWebview;
    if (webview) {
      // We need to capture via Electron's webContents
      // This is a placeholder - actual implementation needs IPC
      console.log('[Screenshot] Visible area capture requested');
    }

    return {
      success: false,
      error: 'Screenshot capture not available in this environment',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

/**
 * Capture full page screenshot (scrolling capture)
 */
export async function captureFullPage(
  options: Partial<ScreenshotOptions> = {}
): Promise<ScreenshotResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options, mode: 'fullPage' as ScreenshotMode };
  
  try {
    const electron = (window as any).electron;
    
    if (electron?.screenshot?.captureFullPage) {
      const result = await electron.screenshot.captureFullPage(opts);
      return {
        ...result,
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Full page capture not available',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

/**
 * Capture selection area screenshot
 */
export async function captureSelection(
  selection: ScreenshotSelection,
  options: Partial<ScreenshotOptions> = {}
): Promise<ScreenshotResult> {
  const opts = { 
    ...DEFAULT_OPTIONS, 
    ...options, 
    mode: 'selection' as ScreenshotMode,
    selection,
  };
  
  try {
    const electron = (window as any).electron;
    
    if (electron?.screenshot?.captureSelection) {
      const result = await electron.screenshot.captureSelection(selection, opts);
      return {
        ...result,
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Selection capture not available',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

/**
 * Capture specific element screenshot
 */
export async function captureElement(
  selector: string,
  options: Partial<ScreenshotOptions> = {}
): Promise<ScreenshotResult> {
  const opts = { 
    ...DEFAULT_OPTIONS, 
    ...options, 
    mode: 'element' as ScreenshotMode,
    elementSelector: selector,
  };
  
  try {
    const electron = (window as any).electron;
    
    if (electron?.screenshot?.captureElement) {
      const result = await electron.screenshot.captureElement(selector, opts);
      return {
        ...result,
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Element capture not available',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// Download/Export Functions
// ============================================================================

/**
 * Download screenshot as file
 */
export function downloadScreenshot(
  result: ScreenshotResult,
  filename?: string
): void {
  if (!result.success || !result.dataUrl) {
    console.error('[Screenshot] No screenshot to download');
    return;
  }

  const defaultName = `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const name = filename || defaultName;
  const extension = result.dataUrl.includes('image/png') ? '.png' 
    : result.dataUrl.includes('image/jpeg') ? '.jpg' 
    : '.webp';

  const link = document.createElement('a');
  link.href = result.dataUrl;
  link.download = name + extension;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy screenshot to clipboard
 */
export async function copyScreenshotToClipboard(
  result: ScreenshotResult
): Promise<boolean> {
  if (!result.success || !result.dataUrl) {
    return false;
  }

  try {
    // Convert data URL to blob
    const response = await fetch(result.dataUrl);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    return true;
  } catch (error) {
    console.error('[Screenshot] Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Save screenshot to file with dialog
 */
export async function saveScreenshotWithDialog(
  result: ScreenshotResult,
  defaultFilename?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!result.success || !result.dataUrl) {
    return { success: false, error: 'No screenshot data' };
  }

  try {
    const electron = (window as any).electron;
    
    if (electron?.screenshot?.saveWithDialog) {
      return await electron.screenshot.saveWithDialog(result.dataUrl, defaultFilename);
    }

    // Fallback: Use download
    downloadScreenshot(result, defaultFilename);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert blob to data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert data URL to blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Get MIME type from format
 */
export function formatToMimeType(format: ScreenshotFormat): string {
  switch (format) {
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'png':
    default: return 'image/png';
  }
}

/**
 * Get file extension from format
 */
export function formatToExtension(format: ScreenshotFormat): string {
  switch (format) {
    case 'jpeg': return '.jpg';
    case 'webp': return '.webp';
    case 'png':
    default: return '.png';
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Estimate data URL size in bytes
 */
export function estimateDataUrlSize(dataUrl: string): number {
  // Remove the data URL prefix and calculate base64 size
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}

// ============================================================================
// Selection Overlay Helper
// ============================================================================

/** Selection state for UI */
export interface SelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Calculate selection rectangle from selection state
 */
export function getSelectionRect(state: SelectionState): ScreenshotSelection {
  const x = Math.min(state.startX, state.endX);
  const y = Math.min(state.startY, state.endY);
  const width = Math.abs(state.endX - state.startX);
  const height = Math.abs(state.endY - state.startY);
  
  return { x, y, width, height };
}
