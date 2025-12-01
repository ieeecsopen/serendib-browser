/**
 * Settings Page Component (shadcn-style)
 * 
 * A modern settings page with organized sections and shadcn-style components.
 */

import React from 'react';
import type { BrowserSettings } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Select } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { 
  Settings, Globe, Shield, Zap, Palette, Bell, 
  Languages, Search, Monitor, HardDrive, Eye, 
  Lock, Wifi, Database, RefreshCw
} from 'lucide-react';

interface SettingsPageProps {
  settings: BrowserSettings;
  onUpdateSetting: (key: keyof BrowserSettings, value: any) => void;
}

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
      <div className="p-2 rounded-lg bg-zinc-900 text-zinc-400">
        {icon}
      </div>
      <div className="space-y-1">
        <Label htmlFor={htmlFor} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-zinc-500 max-w-md">
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

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  settings, 
  onUpdateSetting 
}) => {
  return (
    <div className="flex-1 bg-black overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 text-white">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
              <p className="text-sm text-zinc-500">
                Manage your browser preferences and configurations
              </p>
            </div>
          </div>
        </header>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-zinc-400" />
              <CardTitle>General</CardTitle>
            </div>
            <CardDescription>
              Basic browser settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
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
                className="w-40"
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
                className="w-40"
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

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-zinc-400" />
              <CardTitle>Privacy & Security</CardTitle>
              <Badge variant="success" className="ml-2">Protected</Badge>
            </div>
            <CardDescription>
              Control how your data is handled and protected
            </CardDescription>
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
            
            <Separator />
            
            <SettingItem
              icon={<Database size={18} />}
              label="Clear Data on Exit"
              description="Automatically delete browsing history and cookies when closing the browser"
              htmlFor="clear-data-switch"
            >
              <Switch
                id="clear-data-switch"
                checked={settings.clearDataOnExit ?? false}
                onCheckedChange={(v) => onUpdateSetting('clearDataOnExit', v)}
              />
            </SettingItem>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-zinc-400" />
              <CardTitle>Performance</CardTitle>
            </div>
            <CardDescription>
              Optimize browser performance and resource usage
            </CardDescription>
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

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-zinc-400" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize how the browser looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <SettingItem
              icon={<Monitor size={18} />}
              label="Theme"
              description="Choose between light and dark mode"
              htmlFor="theme-select"
            >
              <Select
                id="theme-select"
                value={settings.theme ?? 'dark'}
                onValueChange={(v) => onUpdateSetting('theme', v)}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
                className="w-32"
              />
            </SettingItem>
            
            <Separator />
            
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

        {/* Footer */}
        <div className="pt-4 pb-8 text-center space-y-2">
          <p className="text-xs text-zinc-600">
            Serendib Browser v1.0.0
          </p>
          <p className="text-xs text-zinc-700">
            Made with ❤️ in Sri Lanka
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
