/**
 * Password Manager Types
 * 
 * Type definitions for the password manager and autofill system.
 */

// Saved credential entry
export interface SavedCredential {
  id: string;
  url: string;
  domain: string;
  username: string;
  password: string; // Encrypted
  name?: string; // Custom name/label
  notes?: string;
  favicon?: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  usageCount: number;
  category?: CredentialCategory;
  tags?: string[];
  // For breach detection
  compromised?: boolean;
  passwordStrength?: PasswordStrength;
}

export type CredentialCategory = 
  | 'login'
  | 'banking'
  | 'social'
  | 'shopping'
  | 'work'
  | 'entertainment'
  | 'other';

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

// For autofill detection
export interface DetectedField {
  type: 'username' | 'email' | 'password' | 'new-password' | 'otp';
  selector: string;
  name?: string;
  id?: string;
  autocomplete?: string;
}

export interface DetectedForm {
  formSelector?: string;
  action?: string;
  fields: DetectedField[];
  isLogin: boolean;
  isSignup: boolean;
}

// Autofill suggestion
export interface AutofillSuggestion {
  credential: SavedCredential;
  matchScore: number; // 0-100
  matchType: 'exact' | 'domain' | 'subdomain';
}

// Password generation options
export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean; // l, 1, I, O, 0
  customSymbols?: string;
}

// Master password / vault
export interface VaultSettings {
  isSetup: boolean;
  masterPasswordHash?: string; // For verification
  salt?: string;
  lockTimeout: number; // minutes, 0 = never
  requireMasterOnAutofill: boolean;
  biometricEnabled: boolean;
  lastUnlockedAt?: number;
}

// For IPC communication
export interface PasswordSaveRequest {
  url: string;
  username: string;
  password: string;
  replace?: boolean; // Replace existing for same url/username
}

export interface AutofillRequest {
  domain: string;
  url: string;
}

export interface AutofillResponse {
  suggestions: AutofillSuggestion[];
  hasExactMatch: boolean;
}

// Password manager settings
export interface PasswordManagerSettings {
  enabled: boolean;
  autoSavePrompt: boolean;
  autoFillEnabled: boolean;
  showSuggestions: boolean;
  generateStrongPasswords: boolean;
  defaultGeneratorOptions: PasswordGeneratorOptions;
  syncEnabled: boolean;
  breachMonitoring: boolean;
}

// Export/Import
export interface PasswordExport {
  version: string;
  exportedAt: number;
  credentials: Omit<SavedCredential, 'password'>[];
  // Passwords exported separately with encryption
}

export interface PasswordImportSource {
  type: 'chrome' | 'firefox' | 'safari' | 'lastpass' | 'bitwarden' | '1password' | 'csv';
  name: string;
}
