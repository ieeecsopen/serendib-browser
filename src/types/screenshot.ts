/**
 * Screenshot/Screen Capture Type Definitions
 */

/** Screenshot capture mode */
export type ScreenshotMode = 'visible' | 'fullPage' | 'selection' | 'element';

/** Screenshot format */
export type ScreenshotFormat = 'png' | 'jpeg' | 'webp';

/** Screenshot capture options */
export interface ScreenshotOptions {
  /** Capture mode */
  mode: ScreenshotMode;
  /** Image format */
  format: ScreenshotFormat;
  /** Quality for JPEG/WebP (0-100) */
  quality?: number;
  /** Selection area (for 'selection' mode) */
  selection?: ScreenshotSelection;
  /** CSS selector (for 'element' mode) */
  elementSelector?: string;
  /** Include cursor in screenshot */
  includeCursor?: boolean;
  /** Delay before capture in ms */
  delay?: number;
  /** Scale factor */
  scaleFactor?: number;
}

/** Selection area for screenshot */
export interface ScreenshotSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Screenshot result */
export interface ScreenshotResult {
  success: boolean;
  /** Data URL of the image */
  dataUrl?: string;
  /** Blob of the image */
  blob?: Blob;
  /** Width of the captured image */
  width?: number;
  /** Height of the captured image */
  height?: number;
  /** File size in bytes */
  size?: number;
  /** Error message if failed */
  error?: string;
  /** Timestamp of capture */
  timestamp: number;
  /** Source URL */
  sourceUrl?: string;
  /** Page title */
  pageTitle?: string;
}

/** Saved screenshot metadata */
export interface SavedScreenshot {
  id: string;
  /** Data URL or file path */
  dataUrl: string;
  /** Original page URL */
  sourceUrl: string;
  /** Page title at time of capture */
  pageTitle: string;
  /** Capture timestamp */
  capturedAt: number;
  /** Screenshot dimensions */
  width: number;
  height: number;
  /** File size in bytes */
  size: number;
  /** Format used */
  format: ScreenshotFormat;
  /** Capture mode used */
  mode: ScreenshotMode;
  /** User annotations/notes */
  notes?: string;
  /** Tags for organization */
  tags?: string[];
}

/** Screenshot editor state */
export interface ScreenshotEditorState {
  isOpen: boolean;
  screenshot: ScreenshotResult | null;
  annotations: ScreenshotAnnotation[];
  currentTool: AnnotationTool;
  currentColor: string;
  currentStrokeWidth: number;
}

/** Annotation on a screenshot */
export interface ScreenshotAnnotation {
  id: string;
  type: 'arrow' | 'rectangle' | 'circle' | 'line' | 'text' | 'blur' | 'highlight';
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
}

/** Annotation tool types */
export type AnnotationTool = 'select' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'text' | 'blur' | 'highlight' | 'crop';
