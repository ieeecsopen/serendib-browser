/**
 * PermissionsPopup Component
 * Shows and manages permissions for the current site
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Camera,
  Mic,
  MapPin,
  Bell,
  Clipboard,
  ClipboardPaste,
  Volume2,
  ExternalLink,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Settings
} from 'lucide-react';
import type { PermissionType, PermissionSetting, SitePermissions, DefaultPermissions } from '../../types';

interface PermissionConfig {
  type: PermissionType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const PERMISSION_CONFIGS: PermissionConfig[] = [
  { type: 'camera', label: 'Camera', icon: Camera, description: 'Access your camera' },
  { type: 'microphone', label: 'Microphone', icon: Mic, description: 'Access your microphone' },
  { type: 'location', label: 'Location', icon: MapPin, description: 'Know your location' },
  { type: 'notifications', label: 'Notifications', icon: Bell, description: 'Send you notifications' },
  { type: 'clipboard-read', label: 'Clipboard Read', icon: Clipboard, description: 'Read your clipboard' },
  { type: 'clipboard-write', label: 'Clipboard Write', icon: ClipboardPaste, description: 'Write to clipboard' },
  { type: 'autoplay', label: 'Autoplay', icon: Volume2, description: 'Autoplay media' },
  { type: 'popups', label: 'Pop-ups', icon: ExternalLink, description: 'Open pop-up windows' },
];

interface PermissionsPopupProps {
  origin: string;
  sitePermissions?: SitePermissions;
  defaultPermissions: DefaultPermissions;
  onUpdatePermission: (origin: string, permission: PermissionType, setting: PermissionSetting) => void;
  onResetSitePermissions: (origin: string) => void;
  onClose: () => void;
}

const PermissionsPopup: React.FC<PermissionsPopupProps> = ({
  origin,
  sitePermissions,
  defaultPermissions,
  onUpdatePermission,
  onResetSitePermissions,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getEffectivePermission = (permType: PermissionType): PermissionSetting => {
    return sitePermissions?.permissions[permType] ?? defaultPermissions[permType];
  };

  const hasCustomPermissions = sitePermissions && Object.keys(sitePermissions.permissions).length > 0;

  const hostname = new URL(origin).hostname;

  return (
    <div 
      ref={popupRef}
      className="absolute top-full left-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-zinc-400" />
          <div>
            <h3 className="text-sm font-medium text-white">Site Permissions</h3>
            <p className="text-xs text-zinc-500 truncate max-w-[180px]">{hostname}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Permissions List */}
      <div className="max-h-80 overflow-y-auto">
        {PERMISSION_CONFIGS.map(config => {
          const Icon = config.icon;
          const effectiveSetting = getEffectivePermission(config.type);
          const isCustom = sitePermissions?.permissions[config.type] !== undefined;

          return (
            <PermissionRow
              key={config.type}
              config={config}
              Icon={Icon}
              setting={effectiveSetting}
              isCustom={isCustom}
              onChangeSetting={(setting) => onUpdatePermission(origin, config.type, setting)}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between bg-zinc-900/50">
        {hasCustomPermissions && (
          <button
            onClick={() => onResetSitePermissions(origin)}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Reset to defaults
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};

interface PermissionRowProps {
  config: PermissionConfig;
  Icon: React.ElementType;
  setting: PermissionSetting;
  isCustom: boolean;
  onChangeSetting: (setting: PermissionSetting) => void;
}

const PermissionRow: React.FC<PermissionRowProps> = ({
  config,
  Icon,
  setting,
  isCustom,
  onChangeSetting,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getSettingColor = (s: PermissionSetting) => {
    switch (s) {
      case 'allow': return 'text-green-400';
      case 'block': return 'text-red-400';
      case 'ask': return 'text-amber-400';
    }
  };

  const getSettingIcon = (s: PermissionSetting) => {
    switch (s) {
      case 'allow': return <Check size={12} className="text-green-400" />;
      case 'block': return <X size={12} className="text-red-400" />;
      case 'ask': return <AlertCircle size={12} className="text-amber-400" />;
    }
  };

  const options: PermissionSetting[] = ['allow', 'ask', 'block'];

  return (
    <div className="px-4 py-2.5 hover:bg-white/5 flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${setting === 'allow' ? 'bg-green-500/10' : setting === 'block' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
          <Icon size={14} className={getSettingColor(setting)} />
        </div>
        <div>
          <span className="text-sm text-white flex items-center gap-1.5">
            {config.label}
            {isCustom && (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
                Custom
              </span>
            )}
          </span>
          <p className="text-xs text-zinc-500">{config.description}</p>
        </div>
      </div>

      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg hover:bg-white/10 transition-colors capitalize"
        >
          <span className={getSettingColor(setting)}>{setting}</span>
          <ChevronDown size={12} className="text-zinc-500" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-28 bg-zinc-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  onChangeSetting(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/10 transition-colors capitalize ${
                  setting === opt ? 'bg-white/5' : ''
                }`}
              >
                {getSettingIcon(opt)}
                <span className={getSettingColor(opt)}>{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionsPopup;
