/**
 * Password Manager Service
 * 
 * Handles password storage, encryption, generation, and autofill logic.
 * Uses AES-GCM encryption for secure password storage.
 */

import type {
  SavedCredential,
  PasswordGeneratorOptions,
  VaultSettings,
  AutofillSuggestion,
  PasswordStrength,
  PasswordManagerSettings,
  CredentialCategory,
} from '../types/passwords';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'serendib-passwords';
const VAULT_KEY = 'serendib-vault-settings';
const SETTINGS_KEY = 'serendib-password-settings';

const DEFAULT_GENERATOR_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: true,
};

const DEFAULT_SETTINGS: PasswordManagerSettings = {
  enabled: true,
  autoSavePrompt: true,
  autoFillEnabled: true,
  showSuggestions: true,
  generateStrongPasswords: true,
  defaultGeneratorOptions: DEFAULT_GENERATOR_OPTIONS,
  syncEnabled: false,
  breachMonitoring: false,
};

// ============================================================================
// Encryption Utilities
// ============================================================================

// Derive encryption key from master password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate a random salt
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Generate a random IV for AES-GCM
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt data
async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = generateIV();
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt data
async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(c => c.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// Hash master password for verification
async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const data = new Uint8Array([...salt, ...encoder.encode(password)]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// ============================================================================
// Vault Management
// ============================================================================

let cachedKey: CryptoKey | null = null;
let lastUnlockTime: number = 0;

export function getVaultSettings(): VaultSettings {
  const stored = localStorage.getItem(VAULT_KEY);
  if (!stored) {
    return {
      isSetup: false,
      lockTimeout: 15,
      requireMasterOnAutofill: false,
      biometricEnabled: false,
    };
  }
  return JSON.parse(stored);
}

export function saveVaultSettings(settings: VaultSettings): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(settings));
}

export async function setupVault(masterPassword: string): Promise<boolean> {
  try {
    const salt = generateSalt();
    const saltString = btoa(String.fromCharCode(...salt));
    const hash = await hashPassword(masterPassword, salt);
    
    const settings: VaultSettings = {
      isSetup: true,
      masterPasswordHash: hash,
      salt: saltString,
      lockTimeout: 15,
      requireMasterOnAutofill: false,
      biometricEnabled: false,
    };
    
    saveVaultSettings(settings);
    
    // Cache the key
    cachedKey = await deriveKey(masterPassword, salt);
    lastUnlockTime = Date.now();
    
    return true;
  } catch (error) {
    console.error('Failed to setup vault:', error);
    return false;
  }
}

export async function unlockVault(masterPassword: string): Promise<boolean> {
  try {
    const settings = getVaultSettings();
    if (!settings.isSetup || !settings.salt || !settings.masterPasswordHash) {
      return false;
    }
    
    const salt = new Uint8Array(atob(settings.salt).split('').map(c => c.charCodeAt(0)));
    const hash = await hashPassword(masterPassword, salt);
    
    if (hash !== settings.masterPasswordHash) {
      return false;
    }
    
    cachedKey = await deriveKey(masterPassword, salt);
    lastUnlockTime = Date.now();
    
    return true;
  } catch (error) {
    console.error('Failed to unlock vault:', error);
    return false;
  }
}

export function lockVault(): void {
  cachedKey = null;
  lastUnlockTime = 0;
}

export function isVaultUnlocked(): boolean {
  if (!cachedKey) return false;
  
  const settings = getVaultSettings();
  if (settings.lockTimeout === 0) return true;
  
  const elapsed = (Date.now() - lastUnlockTime) / 1000 / 60; // minutes
  if (elapsed > settings.lockTimeout) {
    lockVault();
    return false;
  }
  
  return true;
}

export function isVaultSetup(): boolean {
  return getVaultSettings().isSetup;
}

// ============================================================================
// Password Storage
// ============================================================================

interface StoredCredentials {
  credentials: SavedCredential[];
  version: number;
}

async function getStoredCredentials(): Promise<SavedCredential[]> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const data: StoredCredentials = JSON.parse(stored);
    return data.credentials || [];
  } catch {
    return [];
  }
}

async function saveStoredCredentials(credentials: SavedCredential[]): Promise<void> {
  const data: StoredCredentials = {
    credentials,
    version: 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getAllCredentials(): Promise<SavedCredential[]> {
  return getStoredCredentials();
}

export async function getCredentialById(id: string): Promise<SavedCredential | null> {
  const credentials = await getStoredCredentials();
  return credentials.find(c => c.id === id) || null;
}

export async function saveCredential(
  url: string,
  username: string,
  password: string,
  options?: {
    name?: string;
    notes?: string;
    category?: CredentialCategory;
    tags?: string[];
  }
): Promise<SavedCredential> {
  if (!isVaultUnlocked() || !cachedKey) {
    throw new Error('Vault is locked');
  }
  
  const domain = extractDomain(url);
  const encryptedPassword = await encryptData(password, cachedKey);
  
  const credential: SavedCredential = {
    id: `pwd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    domain,
    username,
    password: encryptedPassword,
    name: options?.name,
    notes: options?.notes,
    category: options?.category || 'login',
    tags: options?.tags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
    passwordStrength: analyzePasswordStrength(password),
  };
  
  const credentials = await getStoredCredentials();
  credentials.push(credential);
  await saveStoredCredentials(credentials);
  
  return credential;
}

export async function updateCredential(
  id: string,
  updates: Partial<Pick<SavedCredential, 'username' | 'password' | 'name' | 'notes' | 'category' | 'tags'>>
): Promise<SavedCredential | null> {
  if (!isVaultUnlocked() || !cachedKey) {
    throw new Error('Vault is locked');
  }
  
  const credentials = await getStoredCredentials();
  const index = credentials.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  const credential = credentials[index];
  
  if (updates.password) {
    credential.password = await encryptData(updates.password, cachedKey);
    credential.passwordStrength = analyzePasswordStrength(updates.password);
  }
  if (updates.username !== undefined) credential.username = updates.username;
  if (updates.name !== undefined) credential.name = updates.name;
  if (updates.notes !== undefined) credential.notes = updates.notes;
  if (updates.category !== undefined) credential.category = updates.category;
  if (updates.tags !== undefined) credential.tags = updates.tags;
  
  credential.updatedAt = Date.now();
  
  await saveStoredCredentials(credentials);
  return credential;
}

export async function deleteCredential(id: string): Promise<boolean> {
  const credentials = await getStoredCredentials();
  const filtered = credentials.filter(c => c.id !== id);
  
  if (filtered.length === credentials.length) return false;
  
  await saveStoredCredentials(filtered);
  return true;
}

export async function decryptPassword(credential: SavedCredential): Promise<string> {
  if (!isVaultUnlocked() || !cachedKey) {
    throw new Error('Vault is locked');
  }
  
  return decryptData(credential.password, cachedKey);
}

export async function recordUsage(id: string): Promise<void> {
  const credentials = await getStoredCredentials();
  const credential = credentials.find(c => c.id === id);
  
  if (credential) {
    credential.lastUsedAt = Date.now();
    credential.usageCount++;
    await saveStoredCredentials(credentials);
  }
}

// ============================================================================
// Autofill
// ============================================================================

export async function getAutofillSuggestions(url: string): Promise<AutofillSuggestion[]> {
  const domain = extractDomain(url);
  const credentials = await getStoredCredentials();
  
  const suggestions: AutofillSuggestion[] = [];
  
  for (const credential of credentials) {
    let matchScore = 0;
    let matchType: 'exact' | 'domain' | 'subdomain' = 'domain';
    
    // Exact URL match
    if (credential.url === url) {
      matchScore = 100;
      matchType = 'exact';
    }
    // Same domain
    else if (credential.domain === domain) {
      matchScore = 80;
      matchType = 'domain';
    }
    // Subdomain match
    else if (domain.endsWith(`.${credential.domain}`) || credential.domain.endsWith(`.${domain}`)) {
      matchScore = 60;
      matchType = 'subdomain';
    }
    
    if (matchScore > 0) {
      // Boost score based on usage
      if (credential.usageCount > 0) {
        matchScore += Math.min(10, credential.usageCount);
      }
      
      // Boost for recent usage
      if (credential.lastUsedAt) {
        const daysSinceUse = (Date.now() - credential.lastUsedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceUse < 7) {
          matchScore += 5;
        }
      }
      
      suggestions.push({
        credential,
        matchScore: Math.min(100, matchScore),
        matchType,
      });
    }
  }
  
  // Sort by match score descending
  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
}

export async function getCredentialsForDomain(domain: string): Promise<SavedCredential[]> {
  const credentials = await getStoredCredentials();
  return credentials.filter(c => 
    c.domain === domain || 
    domain.endsWith(`.${c.domain}`) || 
    c.domain.endsWith(`.${domain}`)
  );
}

// ============================================================================
// Password Generation
// ============================================================================

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'l1IO0';

export function generatePassword(options: Partial<PasswordGeneratorOptions> = {}): string {
  const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };
  
  let charset = '';
  const required: string[] = [];
  
  if (opts.includeUppercase) {
    let chars = UPPERCASE;
    if (opts.excludeAmbiguous) {
      chars = chars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    charset += chars;
    required.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  
  if (opts.includeLowercase) {
    let chars = LOWERCASE;
    if (opts.excludeAmbiguous) {
      chars = chars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    charset += chars;
    required.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  
  if (opts.includeNumbers) {
    let chars = NUMBERS;
    if (opts.excludeAmbiguous) {
      chars = chars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    charset += chars;
    required.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  
  if (opts.includeSymbols) {
    const chars = opts.customSymbols || SYMBOLS;
    charset += chars;
    required.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  
  if (charset.length === 0) {
    charset = LOWERCASE + NUMBERS;
  }
  
  // Generate password
  const passwordArray: string[] = [...required];
  const remainingLength = opts.length - required.length;
  
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % charset.length;
    passwordArray.push(charset[randomIndex]);
  }
  
  // Shuffle the password
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

export function analyzePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Patterns (negative)
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/^[a-zA-Z]+$/.test(password)) score -= 1; // Only letters
  if (/^[0-9]+$/.test(password)) score -= 1; // Only numbers
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  if (score <= 6) return 'good';
  return 'strong';
}

export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak': return '#ef4444';
    case 'fair': return '#f59e0b';
    case 'good': return '#22c55e';
    case 'strong': return '#10b981';
  }
}

export function getPasswordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak': return 'Weak';
    case 'fair': return 'Fair';
    case 'good': return 'Good';
    case 'strong': return 'Strong';
  }
}

// ============================================================================
// Settings
// ============================================================================

export function getPasswordManagerSettings(): PasswordManagerSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function savePasswordManagerSettings(settings: Partial<PasswordManagerSettings>): void {
  const current = getPasswordManagerSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

// ============================================================================
// Utilities
// ============================================================================

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function formatCredentialForDisplay(credential: SavedCredential): string {
  return credential.name || credential.username || credential.domain;
}

export function groupCredentialsByDomain(credentials: SavedCredential[]): Map<string, SavedCredential[]> {
  const grouped = new Map<string, SavedCredential[]>();
  
  for (const credential of credentials) {
    const existing = grouped.get(credential.domain) || [];
    existing.push(credential);
    grouped.set(credential.domain, existing);
  }
  
  return grouped;
}

export function searchCredentials(credentials: SavedCredential[], query: string): SavedCredential[] {
  const lowerQuery = query.toLowerCase();
  
  return credentials.filter(c =>
    c.domain.toLowerCase().includes(lowerQuery) ||
    c.username.toLowerCase().includes(lowerQuery) ||
    c.name?.toLowerCase().includes(lowerQuery) ||
    c.url.toLowerCase().includes(lowerQuery) ||
    c.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

// Export all credentials (without decrypted passwords)
export async function exportCredentials(): Promise<string> {
  const credentials = await getStoredCredentials();
  const exportData = credentials.map(({ password, ...rest }) => rest);
  return JSON.stringify(exportData, null, 2);
}

// Get statistics
export async function getPasswordStats(): Promise<{
  total: number;
  weak: number;
  reused: number;
  old: number;
  compromised: number;
}> {
  const credentials = await getStoredCredentials();
  
  const passwordHashes = new Map<string, number>();
  let weak = 0;
  let old = 0;
  let compromised = 0;
  
  const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
  
  for (const credential of credentials) {
    // Count password reuse by encrypted value
    const count = passwordHashes.get(credential.password) || 0;
    passwordHashes.set(credential.password, count + 1);
    
    if (credential.passwordStrength === 'weak') weak++;
    if (credential.updatedAt < sixMonthsAgo) old++;
    if (credential.compromised) compromised++;
  }
  
  const reused = Array.from(passwordHashes.values()).filter(c => c > 1).length;
  
  return {
    total: credentials.length,
    weak,
    reused,
    old,
    compromised,
  };
}
