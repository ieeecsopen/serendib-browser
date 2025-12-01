/**
 * Settings Page Component (shadcn-style)
 * 
 * A modern settings page with sidebar navigation and organized sections.
 */

import React, { useState } from 'react';
import type { BrowserSettings, DefaultPermissions, PermissionType, PermissionSetting, SitePermissions } from '../../types';
import { DEFAULT_PERMISSIONS } from '../../constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Select } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { 
  Settings, Globe, Shield, Zap, Palette, Bell, 
  Languages, Search, Monitor, HardDrive, Eye, 
  Lock, Wifi, Database, RefreshCw, ChevronRight,
  Keyboard, Info, Download, Trash2, Key,
  Camera, Mic, MapPin, Clipboard, ClipboardPaste, Volume2, ExternalLink
} from 'lucide-react';

interface SettingsPageProps {
  settings: BrowserSettings;
  onUpdateSetting: (key: keyof BrowserSettings, value: any) => void;
  onOpenPasswordManager?: () => void;
  // Permissions
  sitePermissionsMap?: Record<string, SitePermissions>;
  defaultPermissions?: DefaultPermissions;
  onUpdateDefaultPermission?: (permission: PermissionType, setting: PermissionSetting) => void;
  onResetSitePermissions?: (origin: string) => void;
  onClearAllSitePermissions?: () => void;
}

// Section types
type SettingsSection = 'general' | 'privacy' | 'permissions' | 'passwords' | 'performance' | 'appearance' | 'shortcuts' | 'about';

// Navigation items
const navItems: { id: SettingsSection; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general', label: 'General', icon: <Globe size={18} />, description: 'Language, search, tabs' },
  { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={18} />, description: 'Tracking, data, blockers' },
  { id: 'permissions', label: 'Site Permissions', icon: <Lock size={18} />, description: 'Camera, mic, location' },
  { id: 'passwords', label: 'Passwords', icon: <Key size={18} />, description: 'Saved logins, autofill' },
  { id: 'performance', label: 'Performance', icon: <Zap size={18} />, description: 'Speed, memory, data' },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} />, description: 'Theme, notifications' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard size={18} />, description: 'Hotkeys, commands' },
  { id: 'about', label: 'About', icon: <Info size={18} />, description: 'Version, credits' },
];

// Language options
const languageOptions = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'si-LK', label: 'සිංහල (LK)' },
  { value: 'ta-LK', label: 'தமிழ் (LK)' },
  { value: 'en-GB', label: 'English (UK)' },
];

// Search engine options
const searchEngineOptions = [
  { value: 'Google', label: 'Google' },
  { value: 'Bing', label: 'Bing' },
  { value: 'DuckDuckGo', label: 'DuckDuckGo' },
  { value: 'Brave', label: 'Brave Search' },
];

// Setting Item Component
const SettingItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
}> = ({ icon, label, description, children, htmlFor }) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex items-start gap-4">
      <div 
        className="p-2 rounded-lg"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <Label htmlFor={htmlFor} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs max-w-md" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
    </div>
    <div className="shrink-0">
      {children}
    </div>
  </div>
);

// Keyboard Shortcut Item
const ShortcutItem: React.FC<{ keys: string[]; action: string }> = ({ keys, action }) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          <kbd 
            className="px-2 py-1 text-xs font-mono rounded"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)' 
            }}
          >
            {key}
          </kbd>
          {i < keys.length - 1 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// Section Components
const GeneralSection: React.FC<SettingsPageProps> = ({ settings, onUpdateSetting }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>General Settings</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Configure basic browser preferences</p>
    </div>
    
    <Card>
      <CardContent className="pt-6 space-y-0">
        <SettingItem
          icon={<Languages size={18} />}
          label="Language"
          description="Select the display language for the browser interface"
          htmlFor="language-select"
        >
          <Select
            id="language-select"
            value={settings.language}
            onValueChange={(v) => onUpdateSetting('language', v)}
            options={languageOptions}
            className="w-44"
          />
        </SettingItem>
        
        <Separator />
        
        <SettingItem
          icon={<Search size={18} />}
          label="Default Search Engine"
          description="Choose which search engine to use for address bar searches"
          htmlFor="search-engine-select"
        >
          <Select
            id="search-engine-select"
            value={settings.searchEngine}
            onValueChange={(v) => onUpdateSetting('searchEngine', v)}
            options={searchEngineOptions}
            className="w-44"
          />
        </SettingItem>
        
        <Separator />
        
        <SettingItem
          icon={<Monitor size={18} />}
          label="Vertical Tabs"
          description="Show tabs in a sidebar instead of the top bar"
          htmlFor="vertical-tabs-switch"
        >
          <Switch
            id="vertical-tabs-switch"
            checked={settings.verticalTabs}
            onCheckedChange={(v) => onUpdateSetting('verticalTabs', v)}
          />
        </SettingItem>
      </CardContent>
    </Card>
  </div>
);

const PrivacySection: React.FC<SettingsPageProps> = ({ settings, onUpdateSetting }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Privacy & Security</h2>
        <p className="text-sm text-zinc-500">Control how your data is handled and protected</p>
      </div>
      <Badge variant="success">Protected</Badge>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tracking Protection</CardTitle>
        <CardDescription>Block trackers and unwanted content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <SettingItem
          icon={<Lock size={18} />}
          label="Ad Blocker"
          description="Block intrusive advertisements and trackers for faster, cleaner browsing"
          htmlFor="ad-blocker-switch"
        >
          <Switch
            id="ad-blocker-switch"
            checked={settings.enableAdBlock}
            onCheckedChange={(v) => onUpdateSetting('enableAdBlock', v)}
          />
        </SettingItem>
        
        <Separator />
        
        <SettingItem
          icon={<Eye size={18} />}
          label="Do Not Track"
          description="Request websites not to track your browsing activity"
          htmlFor="dnt-switch"
        >
          <Switch
            id="dnt-switch"
            checked={settings.doNotTrack ?? true}
            onCheckedChange={(v) => onUpdateSetting('doNotTrack', v)}
          />
        </SettingItem>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data Management</CardTitle>
        <CardDescription>Control your browsing data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <SettingItem
          icon={<Database size={18} />}
          label="Clear Data on Exit"
          description="Automatically delete browsing history and cookies when closing"
          htmlFor="clear-data-switch"
        >
          <Switch
            id="clear-data-switch"
            checked={settings.clearDataOnExit ?? false}
            onCheckedChange={(v) => onUpdateSetting('clearDataOnExit', v)}
          />
        </SettingItem>
        
        <Separator />
        
        <div className="py-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 size={16} />
            Clear All Browsing Data
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Permission configuration for the settings page
const PERMISSION_SETTINGS: {
  type: PermissionType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { type: 'camera', label: 'Camera', icon: Camera, description: 'Allow websites to access your camera' },
  { type: 'microphone', label: 'Microphone', icon: Mic, description: 'Allow websites to access your microphone' },
  { type: 'location', label: 'Location', icon: MapPin, description: 'Allow websites to know your location' },
  { type: 'notifications', label: 'Notifications', icon: Bell, description: 'Allow websites to send you notifications' },
  { type: 'clipboard-read', label: 'Clipboard Read', icon: Clipboard, description: 'Allow websites to read your clipboard' },
  { type: 'clipboard-write', label: 'Clipboard Write', icon: ClipboardPaste, description: 'Allow websites to write to clipboard' },
  { type: 'autoplay', label: 'Autoplay Media', icon: Volume2, description: 'Allow websites to autoplay media' },
  { type: 'popups', label: 'Pop-ups', icon: ExternalLink, description: 'Allow websites to open pop-up windows' },
];

interface PermissionsSectionProps {
  sitePermissionsMap?: Record<string, SitePermissions>;
  defaultPermissions: DefaultPermissions;
  onUpdateDefaultPermission?: (permission: PermissionType, setting: PermissionSetting) => void;
  onResetSitePermissions?: (origin: string) => void;
  onClearAllSitePermissions?: () => void;
}

const PermissionsSection: React.FC<PermissionsSectionProps> = ({
  sitePermissionsMap = {},
  defaultPermissions,
  onUpdateDefaultPermission,
  onResetSitePermissions,
  onClearAllSitePermissions,
}) => {
  const sitesList: SitePermissions[] = Object.values(sitePermissionsMap);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Site Permissions</h2>
        <p className="text-sm text-zinc-500">Control what websites can access</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Permissions</CardTitle>
          <CardDescription>Default behavior for all websites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {PERMISSION_SETTINGS.map((perm, index) => {
            const Icon = perm.icon;
            const currentSetting = defaultPermissions[perm.type];
            return (
              <React.Fragment key={perm.type}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-zinc-900 text-zinc-400">
                      <Icon size={18} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{perm.label}</Label>
                      <p className="text-xs text-zinc-500 max-w-md">{perm.description}</p>
                    </div>
                  </div>
                  <Select
                    value={currentSetting}
                    onValueChange={(v) => onUpdateDefaultPermission?.(perm.type, v as PermissionSetting)}
                    options={[
                      { value: 'allow', label: 'Allow' },
                      { value: 'ask', label: 'Ask' },
                      { value: 'block', label: 'Block' },
                    ]}
                    className="w-28"
                  />
                </div>
              </React.Fragment>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sites with Custom Permissions</CardTitle>
          <CardDescription>
            {sitesList.length === 0 
              ? 'No sites have custom permissions yet'
              : `${sitesList.length} site${sitesList.length === 1 ? ' has' : 's have'} custom permissions`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sitesList.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">
              <Shield className="mx-auto mb-3 w-8 h-8 opacity-50" />
              <p>Sites with custom permissions will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sitesList.map((site) => {
                const permCount = Object.keys(site.permissions).length;
                return (
                  <div
                    key={site.origin}
                    className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {new URL(site.origin).hostname}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {permCount} custom permission{permCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => onResetSitePermissions?.(site.origin)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Reset
                    </button>
                  </div>
                );
              })}
              
              {sitesList.length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={onClearAllSitePermissions}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Clear All Site Permissions
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PasswordsSection: React.FC<{ onOpenPasswordManager?: () => void }> = ({ onOpenPasswordManager }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Passwords</h2>
      <p className="text-sm text-zinc-500">Manage saved logins and autofill settings</p>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Password Manager</CardTitle>
        <CardDescription>View and manage your saved passwords</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          onClick={onOpenPasswordManager}
          className="flex items-center gap-3 w-full p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors group"
        >
          <div className="p-3 rounded-xl bg-zinc-800 text-white group-hover:bg-zinc-700">
            <Key size={24} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-white">Open Password Manager</p>
            <p className="text-sm text-zinc-500">View, edit, and delete saved passwords</p>
          </div>
          <ChevronRight size={20} className="text-zinc-500 group-hover:text-white" />
        </button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Autofill Settings</CardTitle>
        <CardDescription>Control automatic form filling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <SettingItem
          icon={<Key size={18} />}
          label="Offer to Save Passwords"
          description="Ask to save passwords when signing in to websites"
        >
          <Switch checked={true} onCheckedChange={() => {}} />
        </SettingItem>
        
        <Separator />
        
        <SettingItem
          icon={<Lock size={18} />}
          label="Auto-fill Credentials"
          description="Automatically fill in saved usernames and passwords"
        >
          <Switch checked={true} onCheckedChange={() => {}} />
        </SettingItem>
        
        <Separator />
        
        <SettingItem
          icon={<Shield size={18} />}
          label="Password Breach Alerts"
          description="Notify when saved passwords appear in data breaches"
        >
          <Switch checked={true} onCheckedChange={() => {}} />
        </SettingItem>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vault Security</CardTitle>
        <CardDescription>Protect your password vault</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <SettingItem
          icon={<Lock size={18} />}
          label="Auto-lock Timeout"
          description="Lock the vault after a period of inactivity"
        >
          <Select
            value="15"
            onValueChange={() => {}}
            options={[
              { value: '5', label: '5 minutes' },
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' },
              { value: '0', label: 'Never' },
            ]}
            className="w-32"
          />
        </SettingItem>
        
        <Separator />
        
        <div className="py-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors">
            <Lock size={16} />
            Change Master Password
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const PerformanceSection: React.FC<SettingsPageProps> = ({ settings, onUpdateSetting }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Performance</h2>
      <p className="text-sm text-zinc-500">Optimize browser speed and resource usage</p>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resource Optimization</CardTitle>
        <CardDescription>Reduce memory and data usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <SettingItem
          icon={<Wifi size={18} />}
          label="Data Saver Mode"
          description="Reduce data usage by compressing images and deferring non-essential content"
          htmlFor="data-saver-switch"
        >
          <Switch
            id="data-saver-switch"
            checked={settings.dataSaver}
            onCheckedChange={(v) => onUpdateSetting('dataSaver', v)}
          />
        </SettingItem>
        
        <Separator />
        
        <SettingItem
          icon={<HardDrive size={18} />}
          label="Memory Saver"
          description="Free up memory by suspending inactive tabs automatically"
          htmlFor="memory-saver-switch"
        >
          <Switch
            id="memory-saver-switch"
            checked={settings.memorySaver}
            onCheckedChange={(v) => onUpdateSetting('memorySaver', v)}
          />
        </SettingItem>
        
        <Separator />
        
        <SettingItem
          icon={<RefreshCw size={18} />}
          label="Low-spec Mode"
          description="Disable animations and effects for better performance on older devices"
          htmlFor="low-spec-switch"
        >
          <Switch
            id="low-spec-switch"
            checked={settings.lowSpecMode}
            onCheckedChange={(v) => onUpdateSetting('lowSpecMode', v)}
          />
        </SettingItem>
      </CardContent>
    </Card>
  </div>
);

const AppearanceSection: React.FC<SettingsPageProps> = ({ settings, onUpdateSetting }) => {
  const themeOptions = [
    { id: 'dark', name: 'Dark', preview: 'bg-zinc-900', headerBg: 'bg-zinc-700' },
    { id: 'light', name: 'Light', preview: 'bg-zinc-100', headerBg: 'bg-zinc-300' },
    { id: 'serendib', name: 'Serendib', preview: 'bg-[#12121a]', headerBg: 'bg-purple-700' },
    { id: 'midnight', name: 'Midnight', preview: 'bg-[#1e293b]', headerBg: 'bg-blue-700' },
    { id: 'forest', name: 'Forest', preview: 'bg-[#132018]', headerBg: 'bg-green-700' },
    { id: 'rose', name: 'Rose', preview: 'bg-[#200a14]', headerBg: 'bg-pink-700' },
    { id: 'sunset', name: 'Sunset', preview: 'bg-[#251510]', headerBg: 'bg-orange-700' },
    { id: 'nord', name: 'Nord', preview: 'bg-[#3b4252]', headerBg: 'bg-cyan-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Customize how the browser looks and feels</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Choose your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {themeOptions.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onUpdateSetting('theme', theme.id)}
                className={`
                  relative p-3 rounded-xl border-2 transition-all
                  ${(settings.theme ?? 'dark') === theme.id 
                    ? 'border-white/50 ring-2 ring-white/20' 
                    : 'border-transparent hover:border-white/20'
                  }
                `}
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className={`w-full aspect-video rounded-lg mb-2 overflow-hidden ${theme.preview}`}>
                  <div className={`h-2 ${theme.headerBg}`} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{theme.name}</span>
                {(settings.theme ?? 'dark') === theme.id && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <SettingItem
            icon={<Bell size={18} />}
            label="Notifications"
            description="Allow websites to show notifications"
            htmlFor="notifications-switch"
          >
            <Switch
              id="notifications-switch"
              checked={settings.notifications ?? true}
              onCheckedChange={(v) => onUpdateSetting('notifications', v)}
            />
          </SettingItem>
        </CardContent>
      </Card>
    </div>
  );
};

const ShortcutsSection: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Keyboard Shortcuts</h2>
      <p className="text-sm text-zinc-500">Quick access to browser features</p>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Navigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <ShortcutItem keys={['Ctrl', 'T']} action="New Tab" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'W']} action="Close Tab" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'Shift', 'T']} action="Reopen Closed Tab" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'Tab']} action="Next Tab" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'Shift', 'Tab']} action="Previous Tab" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Browser</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <ShortcutItem keys={['Ctrl', 'L']} action="Focus Address Bar" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'F']} action="Find in Page" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'R']} action="Reload Page" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'Shift', 'S']} action="Save Snapshot" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'D']} action="Save for Offline" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'P']} action="Print Page" />
        <Separator />
        <ShortcutItem keys={['F12']} action="Developer Tools" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'Shift', 'I']} action="Inspect Element" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Zoom</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <ShortcutItem keys={['Ctrl', '+']} action="Zoom In" />
        <Separator />
        <ShortcutItem keys={['Ctrl', '-']} action="Zoom Out" />
        <Separator />
        <ShortcutItem keys={['Ctrl', '0']} action="Reset Zoom" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">View</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <ShortcutItem keys={['F11']} action="Toggle Full Screen" />
        <Separator />
        <ShortcutItem keys={['Esc']} action="Exit Full Screen" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workspaces</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <ShortcutItem keys={['Ctrl', '1-9']} action="Switch to Tab 1-9" />
        <Separator />
        <ShortcutItem keys={['Ctrl', 'Shift', 'N']} action="New Disposable Tab" />
      </CardContent>
    </Card>
  </div>
);

const AboutSection: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">About Serendib Browser</h2>
      <p className="text-sm text-zinc-500">Browser information and credits</p>
    </div>
    
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600">
            <Globe size={32} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Serendib Browser</h3>
            <p className="text-sm text-zinc-500">Version 1.0.0</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Electron</span>
            <span className="text-zinc-300">v33.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Chromium</span>
            <span className="text-zinc-300">v130.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Node.js</span>
            <span className="text-zinc-300">v20.18.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">React</span>
            <span className="text-zinc-300">v19.2.0</span>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors">
            <Download size={16} />
            Check for Updates
          </button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6 text-center">
        <p className="text-sm text-zinc-500 mb-2">
          Made with ❤️ in Sri Lanka
        </p>
        <p className="text-xs text-zinc-600">
          © 2025 Serendib Browser. All rights reserved.
        </p>
      </CardContent>
    </Card>
  </div>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  settings, 
  onUpdateSetting,
  onOpenPasswordManager,
  sitePermissionsMap = {},
  defaultPermissions = DEFAULT_PERMISSIONS,
  onUpdateDefaultPermission,
  onResetSitePermissions,
  onClearAllSitePermissions,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection settings={settings} onUpdateSetting={onUpdateSetting} />;
      case 'privacy':
        return <PrivacySection settings={settings} onUpdateSetting={onUpdateSetting} />;
      case 'permissions':
        return (
          <PermissionsSection
            sitePermissionsMap={sitePermissionsMap}
            defaultPermissions={defaultPermissions}
            onUpdateDefaultPermission={onUpdateDefaultPermission}
            onResetSitePermissions={onResetSitePermissions}
            onClearAllSitePermissions={onClearAllSitePermissions}
          />
        );
      case 'passwords':
        return <PasswordsSection onOpenPasswordManager={onOpenPasswordManager} />;
      case 'performance':
        return <PerformanceSection settings={settings} onUpdateSetting={onUpdateSetting} />;
      case 'appearance':
        return <AppearanceSection settings={settings} onUpdateSetting={onUpdateSetting} />;
      case 'shortcuts':
        return <ShortcutsSection />;
      case 'about':
        return <AboutSection />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-black flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-900 text-white">
              <Settings size={20} />
            </div>
            <h1 className="text-lg font-bold text-white">Settings</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group
                ${activeSection === item.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-lg transition-colors
                ${activeSection === item.id ? 'bg-zinc-700 text-white' : 'text-zinc-500 group-hover:text-zinc-300'}
              `}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs text-zinc-500 truncate">{item.description}</div>
              </div>
              <ChevronRight 
                size={16} 
                className={`shrink-0 transition-transform ${activeSection === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} 
              />
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
