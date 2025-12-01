/**
 * UI-related type definitions
 */

/** Toast notification types */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/** Notification/Toast message */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

/** AI Chat message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

/** Search result item */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}
