/**
 * Autofill Service
 * 
 * Handles form detection, autofill injection, and password save prompts
 * for webviews in the browser.
 */

import type { DetectedForm, DetectedField, AutofillSuggestion, SavedCredential } from '../types/passwords';
import { getAutofillSuggestions, extractDomain, saveCredential, getAllCredentials } from './passwords';

// ============================================================================
// Form Detection Script (injected into webviews)
// ============================================================================

/**
 * JavaScript code to inject into webviews to detect login forms
 * This runs in the webview's context
 */
export const FORM_DETECTION_SCRIPT = `
(function() {
  // Avoid running multiple times
  if (window.__SeranAutofillInitialized) return;
  window.__SeranAutofillInitialized = true;

  const PASSWORD_FIELD_SELECTORS = [
    'input[type="password"]',
    'input[autocomplete*="password"]',
    'input[name*="pass"]',
    'input[id*="pass"]',
  ].join(', ');

  const USERNAME_FIELD_SELECTORS = [
    'input[type="email"]',
    'input[type="text"][autocomplete*="user"]',
    'input[type="text"][autocomplete*="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][id*="user"]',
    'input[type="text"][id*="email"]',
    'input[type="text"][id*="login"]',
    'input[autocomplete="username"]',
  ].join(', ');

  function detectForms() {
    const forms = [];
    const passwordFields = document.querySelectorAll(PASSWORD_FIELD_SELECTORS);
    
    passwordFields.forEach((passwordField, index) => {
      const form = passwordField.closest('form');
      let usernameField = null;
      
      // Find username field in the same form or nearby
      if (form) {
        usernameField = form.querySelector(USERNAME_FIELD_SELECTORS);
      } else {
        // Look for nearby text/email input
        const parent = passwordField.parentElement?.parentElement || document.body;
        usernameField = parent.querySelector(USERNAME_FIELD_SELECTORS);
      }
      
      if (usernameField || passwordField) {
        forms.push({
          id: 'form-' + index,
          formElement: form,
          usernameField: usernameField ? {
            element: usernameField,
            type: usernameField.type,
            name: usernameField.name,
            id: usernameField.id,
            autocomplete: usernameField.autocomplete
          } : null,
          passwordField: passwordField ? {
            element: passwordField,
            type: 'password',
            name: passwordField.name,
            id: passwordField.id,
            autocomplete: passwordField.autocomplete
          } : null
        });
      }
    });
    
    return forms;
  }

  function fillCredentials(username, password) {
    const forms = detectForms();
    if (forms.length === 0) return false;
    
    const form = forms[0];
    let filled = false;
    
    if (form.usernameField && username) {
      form.usernameField.element.value = username;
      form.usernameField.element.dispatchEvent(new Event('input', { bubbles: true }));
      form.usernameField.element.dispatchEvent(new Event('change', { bubbles: true }));
      filled = true;
    }
    
    if (form.passwordField && password) {
      form.passwordField.element.value = password;
      form.passwordField.element.dispatchEvent(new Event('input', { bubbles: true }));
      form.passwordField.element.dispatchEvent(new Event('change', { bubbles: true }));
      filled = true;
    }
    
    return filled;
  }

  function captureSubmission(callback) {
    const forms = detectForms();
    
    forms.forEach(formData => {
      if (formData.formElement) {
        formData.formElement.addEventListener('submit', () => {
          const username = formData.usernameField?.element?.value || '';
          const password = formData.passwordField?.element?.value || '';
          if (username && password) {
            callback({ username, password, url: window.location.href });
          }
        });
      }
    });
    
    // Also detect password field blur as a fallback
    if (forms[0]?.passwordField?.element) {
      forms[0].passwordField.element.addEventListener('blur', () => {
        const username = forms[0]?.usernameField?.element?.value || '';
        const password = forms[0]?.passwordField?.element?.value || '';
        if (username && password && password.length >= 4) {
          // Delay to allow form submission to trigger first
          setTimeout(() => {
            callback({ username, password, url: window.location.href, isBlur: true });
          }, 100);
        }
      });
    }
  }

  function hasPasswordField() {
    return document.querySelectorAll(PASSWORD_FIELD_SELECTORS).length > 0;
  }

  function showAutofillButton(credentials) {
    if (!hasPasswordField()) return;
    
    const forms = detectForms();
    if (forms.length === 0 || !forms[0].usernameField) return;
    
    const usernameField = forms[0].usernameField.element;
    
    // Create autofill button
    const button = document.createElement('div');
    button.id = '__Seran_autofill_btn';
    button.innerHTML = \`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    \`;
    button.style.cssText = \`
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #666;
      background: white;
      border-radius: 4px;
      border: 1px solid #ddd;
      z-index: 10000;
    \`;
    
    // Position relative to username field
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; display: inline-block; width: 100%;';
    usernameField.parentNode.insertBefore(wrapper, usernameField);
    wrapper.appendChild(usernameField);
    wrapper.appendChild(button);
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Show credential picker or auto-fill if only one
      if (credentials.length === 1) {
        window.__SeranFillCredentials(credentials[0].username, credentials[0].password);
      } else {
        window.__SeranShowCredentialPicker(credentials);
      }
    });
  }

  // Expose functions globally
  window.__SeranDetectForms = detectForms;
  window.__SeranFillCredentials = fillCredentials;
  window.__SeranCaptureSubmission = captureSubmission;
  window.__SeranHasPasswordField = hasPasswordField;
  window.__SeranShowAutofillButton = showAutofillButton;
})();
`;

// ============================================================================
// Autofill Manager Class
// ============================================================================

export interface PendingCredential {
  url: string;
  username: string;
  password: string;
  domain: string;
  timestamp: number;
}

export interface AutofillState {
  isEnabled: boolean;
  autoSaveEnabled: boolean;
  pendingCredential: PendingCredential | null;
  showSavePrompt: boolean;
}

// Store pending credentials waiting for user confirmation
let pendingCredentials: Map<string, PendingCredential> = new Map();

/**
 * Get the autofill injection script
 */
export function getAutofillScript(): string {
  return FORM_DETECTION_SCRIPT;
}

/**
 * Generate script to auto-fill credentials in a form
 */
export function getAutofillFillScript(username: string, password: string): string {
  return `
    if (typeof window.__SeranFillCredentials === 'function') {
      window.__SeranFillCredentials(${JSON.stringify(username)}, ${JSON.stringify(password)});
    }
  `;
}

/**
 * Generate script to check if page has a password field
 */
export function getPasswordFieldCheckScript(): string {
  return `
    (function() {
      return typeof window.__SeranHasPasswordField === 'function' 
        ? window.__SeranHasPasswordField() 
        : document.querySelector('input[type="password"]') !== null;
    })();
  `;
}

/**
 * Store a pending credential for potential saving
 */
export function setPendingCredential(credential: PendingCredential): void {
  const key = `${credential.domain}:${credential.username}`;
  pendingCredentials.set(key, credential);
}

/**
 * Get pending credential for a domain
 */
export function getPendingCredential(domain: string): PendingCredential | undefined {
  for (const [key, cred] of pendingCredentials) {
    if (cred.domain === domain) {
      return cred;
    }
  }
  return undefined;
}

/**
 * Clear pending credential
 */
export function clearPendingCredential(domain: string): void {
  for (const [key, cred] of pendingCredentials) {
    if (cred.domain === domain) {
      pendingCredentials.delete(key);
      break;
    }
  }
}

/**
 * Save pending credential to vault
 */
export async function savePendingCredential(domain: string): Promise<boolean> {
  const pending = getPendingCredential(domain);
  if (!pending) return false;
  
  try {
    await saveCredential(pending.url, pending.username, pending.password);
    clearPendingCredential(domain);
    return true;
  } catch (error) {
    console.error('Failed to save credential:', error);
    return false;
  }
}

/**
 * Check if credentials already exist for a domain/username
 */
export async function credentialExists(domain: string, username: string): Promise<boolean> {
  const credentials = await getAllCredentials();
  return credentials.some(c => c.domain === domain && c.username === username);
}

/**
 * Get suggestions for autofill based on current URL
 */
export async function getSuggestionsForUrl(url: string): Promise<AutofillSuggestion[]> {
  return await getAutofillSuggestions(url);
}

// ============================================================================
// Autofill Prompt Component Data
// ============================================================================

export interface SavePasswordPromptData {
  domain: string;
  username: string;
  isUpdate: boolean;
  existingCredentialId?: string;
}

/**
 * Generate data for the save password prompt
 */
export async function getSavePromptData(
  url: string, 
  username: string
): Promise<SavePasswordPromptData | null> {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  const credentials = await getAllCredentials();
  const existing = credentials.find(c => c.domain === domain && c.username === username);
  
  return {
    domain,
    username,
    isUpdate: !!existing,
    existingCredentialId: existing?.id,
  };
}
