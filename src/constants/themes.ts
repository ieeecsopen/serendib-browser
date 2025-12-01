/**
 * Custom Theme Definitions
 * 
 * Defines color schemes for different themes
 */

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgActive: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  
  // Accent colors
  accent: string;
  accentHover: string;
  accentMuted: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Special
  shadow: string;
  overlay: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

// Built-in themes
export const BUILT_IN_THEMES: Record<string, CustomTheme> = {
  dark: {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    colors: {
      bgPrimary: '#050505',
      bgSecondary: '#0A0A0A',
      bgTertiary: '#111111',
      bgHover: 'rgba(255, 255, 255, 0.05)',
      bgActive: 'rgba(255, 255, 255, 0.1)',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      textMuted: '#52525b',
      borderPrimary: 'rgba(255, 255, 255, 0.1)',
      borderSecondary: 'rgba(255, 255, 255, 0.05)',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentMuted: 'rgba(59, 130, 246, 0.2)',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      shadow: 'rgba(0, 0, 0, 0.5)',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
  },
  
  light: {
    id: 'light',
    name: 'Light',
    isDark: false,
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f4f4f5',
      bgTertiary: '#e4e4e7',
      bgHover: 'rgba(0, 0, 0, 0.05)',
      bgActive: 'rgba(0, 0, 0, 0.1)',
      textPrimary: '#09090b',
      textSecondary: '#52525b',
      textMuted: '#a1a1aa',
      borderPrimary: 'rgba(0, 0, 0, 0.1)',
      borderSecondary: 'rgba(0, 0, 0, 0.05)',
      accent: '#2563eb',
      accentHover: '#1d4ed8',
      accentMuted: 'rgba(37, 99, 235, 0.1)',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0891b2',
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(255, 255, 255, 0.8)',
    },
  },
  
  serendib: {
    id: 'serendib',
    name: 'Serendib',
    isDark: true,
    colors: {
      bgPrimary: '#0a0a12',
      bgSecondary: '#12121a',
      bgTertiary: '#1a1a24',
      bgHover: 'rgba(139, 92, 246, 0.1)',
      bgActive: 'rgba(139, 92, 246, 0.2)',
      textPrimary: '#ffffff',
      textSecondary: '#a5b4fc',
      textMuted: '#6366f1',
      borderPrimary: 'rgba(139, 92, 246, 0.2)',
      borderSecondary: 'rgba(139, 92, 246, 0.1)',
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      accentMuted: 'rgba(139, 92, 246, 0.2)',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#38bdf8',
      shadow: 'rgba(139, 92, 246, 0.3)',
      overlay: 'rgba(10, 10, 18, 0.9)',
    },
  },
  
  midnight: {
    id: 'midnight',
    name: 'Midnight Blue',
    isDark: true,
    colors: {
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      bgHover: 'rgba(59, 130, 246, 0.1)',
      bgActive: 'rgba(59, 130, 246, 0.2)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      borderPrimary: 'rgba(148, 163, 184, 0.2)',
      borderSecondary: 'rgba(148, 163, 184, 0.1)',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentMuted: 'rgba(59, 130, 246, 0.2)',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      shadow: 'rgba(0, 0, 0, 0.5)',
      overlay: 'rgba(15, 23, 42, 0.9)',
    },
  },
  
  forest: {
    id: 'forest',
    name: 'Forest',
    isDark: true,
    colors: {
      bgPrimary: '#0a1410',
      bgSecondary: '#132018',
      bgTertiary: '#1a2c20',
      bgHover: 'rgba(34, 197, 94, 0.1)',
      bgActive: 'rgba(34, 197, 94, 0.2)',
      textPrimary: '#ecfdf5',
      textSecondary: '#86efac',
      textMuted: '#4ade80',
      borderPrimary: 'rgba(34, 197, 94, 0.2)',
      borderSecondary: 'rgba(34, 197, 94, 0.1)',
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentMuted: 'rgba(34, 197, 94, 0.2)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#38bdf8',
      shadow: 'rgba(0, 0, 0, 0.5)',
      overlay: 'rgba(10, 20, 16, 0.9)',
    },
  },
  
  rose: {
    id: 'rose',
    name: 'Rose',
    isDark: true,
    colors: {
      bgPrimary: '#18080e',
      bgSecondary: '#200a14',
      bgTertiary: '#2a0e1a',
      bgHover: 'rgba(244, 63, 94, 0.1)',
      bgActive: 'rgba(244, 63, 94, 0.2)',
      textPrimary: '#fff1f2',
      textSecondary: '#fda4af',
      textMuted: '#fb7185',
      borderPrimary: 'rgba(244, 63, 94, 0.2)',
      borderSecondary: 'rgba(244, 63, 94, 0.1)',
      accent: '#f43f5e',
      accentHover: '#e11d48',
      accentMuted: 'rgba(244, 63, 94, 0.2)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#fb7185',
      info: '#38bdf8',
      shadow: 'rgba(244, 63, 94, 0.2)',
      overlay: 'rgba(24, 8, 14, 0.9)',
    },
  },
  
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    isDark: true,
    colors: {
      bgPrimary: '#1a0f08',
      bgSecondary: '#251510',
      bgTertiary: '#301a14',
      bgHover: 'rgba(249, 115, 22, 0.1)',
      bgActive: 'rgba(249, 115, 22, 0.2)',
      textPrimary: '#fff7ed',
      textSecondary: '#fdba74',
      textMuted: '#fb923c',
      borderPrimary: 'rgba(249, 115, 22, 0.2)',
      borderSecondary: 'rgba(249, 115, 22, 0.1)',
      accent: '#f97316',
      accentHover: '#ea580c',
      accentMuted: 'rgba(249, 115, 22, 0.2)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#38bdf8',
      shadow: 'rgba(249, 115, 22, 0.2)',
      overlay: 'rgba(26, 15, 8, 0.9)',
    },
  },

  nord: {
    id: 'nord',
    name: 'Nord',
    isDark: true,
    colors: {
      bgPrimary: '#2e3440',
      bgSecondary: '#3b4252',
      bgTertiary: '#434c5e',
      bgHover: 'rgba(136, 192, 208, 0.1)',
      bgActive: 'rgba(136, 192, 208, 0.2)',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textMuted: '#4c566a',
      borderPrimary: 'rgba(216, 222, 233, 0.2)',
      borderSecondary: 'rgba(216, 222, 233, 0.1)',
      accent: '#88c0d0',
      accentHover: '#81a1c1',
      accentMuted: 'rgba(136, 192, 208, 0.2)',
      success: '#a3be8c',
      warning: '#ebcb8b',
      error: '#bf616a',
      info: '#5e81ac',
      shadow: 'rgba(0, 0, 0, 0.3)',
      overlay: 'rgba(46, 52, 64, 0.9)',
    },
  },
};

// Apply theme to CSS variables and body styles
export const applyTheme = (theme: CustomTheme) => {
  const root = document.documentElement;
  const body = document.body;
  const colors = theme.colors;
  
  // Set CSS variables
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-secondary', colors.bgSecondary);
  root.style.setProperty('--bg-tertiary', colors.bgTertiary);
  root.style.setProperty('--bg-hover', colors.bgHover);
  root.style.setProperty('--bg-active', colors.bgActive);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--border-primary', colors.borderPrimary);
  root.style.setProperty('--border-secondary', colors.borderSecondary);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-hover', colors.accentHover);
  root.style.setProperty('--accent-muted', colors.accentMuted);
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--warning', colors.warning);
  root.style.setProperty('--error', colors.error);
  root.style.setProperty('--info', colors.info);
  root.style.setProperty('--shadow', colors.shadow);
  root.style.setProperty('--overlay', colors.overlay);
  
  // Apply background color directly to body for immediate effect
  body.style.backgroundColor = colors.bgPrimary;
  body.style.color = colors.textPrimary;
  
  // Set dark/light mode class
  if (theme.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
};

// Get theme by ID
export const getTheme = (themeId: string): CustomTheme => {
  return BUILT_IN_THEMES[themeId] || BUILT_IN_THEMES.dark;
};

// Get all theme options for settings
export const getThemeOptions = () => {
  return Object.values(BUILT_IN_THEMES).map(theme => ({
    id: theme.id,
    name: theme.name,
    isDark: theme.isDark,
  }));
};
