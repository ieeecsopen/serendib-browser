/**
 * OmniBox Component (Address Bar)
 * 
 * Navigation bar with URL input, back/forward/refresh controls,
 * container indicator, bookmarks, and main menu.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Container, SitePermissions, DefaultPermissions, PermissionType, PermissionSetting } from '../../types';
import { SiteInfoPopup } from '../ui/SiteInfoPopup';
import { ZoomControl } from '../ui/ZoomControl';
import PermissionsPopup from '../ui/PermissionsPopup';
import { CertificateViewer } from '../ui/CertificateViewer';
import { ShareMenu } from '../ui/ShareMenu';
import { QRCodeGenerator } from '../ui/QRCodeGenerator';
import { SendToDevice } from '../ui/SendToDevice';
import { AddressBarAutocomplete } from './AddressBarAutocomplete';
import { 
  ArrowLeft, ArrowRight, RotateCw, Star, Search, MessageSquare, X, Lock, Puzzle,
  User, Plus, History, Settings, HelpCircle, Download, Briefcase, ShoppingBag, 
  DollarSign, ShieldAlert, DownloadCloud, Check, MoreHorizontal, Camera, Printer, FileText,
  Shield, Code, Maximize, PictureInPicture2, SplitSquareHorizontal, Share2, ShieldCheck,
  QrCode, Send, EyeOff, RotateCcw, Aperture
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

import type { HistoryItem, Bookmark } from '../../types';

interface OmniBoxProps {
  url: string;
  title?: string;
  isLoading: boolean;
  activeContainer: Container;
  containers: Container[];
  onNavigate: (url: string) => void;
  onRefresh: () => void;
  onBack: () => void;
  onForward: () => void;
  onNewTab: () => void;
  onNewTabInContainer: (containerId: string) => void;
  onNewDisposableTab: () => void;
  onNewPrivateTab?: () => void;
  onReopenClosedTab?: () => void;
  onToggleAI: () => void;
  isAiOpen: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onToggleFocus: () => void;
  onSaveOffline: () => void;
  isOfflineSaved: boolean;
  onOpenSnapshots?: () => void;
  // Autocomplete data
  history?: HistoryItem[];
  bookmarks?: Bookmark[];
  // Zoom controls
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onSetZoom?: (level: number) => void;
  // Permissions
  sitePermissions?: SitePermissions;
  defaultPermissions?: DefaultPermissions;
  onUpdatePermission?: (origin: string, permission: PermissionType, setting: PermissionSetting) => void;
  onResetSitePermissions?: (origin: string) => void;
  // Split View
  onToggleSplitView?: () => void;
  isSplitView?: boolean;
  // Private mode indicator
  isPrivateMode?: boolean;
  // Screenshot
  onTakeScreenshot?: () => void;
  onCaptureVisible?: () => void;
  // VPN/Proxy
  onToggleVPN?: () => void;
  isVPNConnected?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getContainerIcon = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'Briefcase': <Briefcase size={12} />,
    'DollarSign': <DollarSign size={12} />,
    'ShoppingBag': <ShoppingBag size={12} />,
    'Trash2': <ShieldAlert size={12} />,
  };
  return iconMap[iconName] || <User size={12} />;
};

// ============================================================================
// Main Component
// ============================================================================

export const OmniBox: React.FC<OmniBoxProps> = ({
  url,
  title = '',
  isLoading,
  activeContainer,
  containers,
  onNavigate,
  onRefresh,
  onBack,
  onForward,
  onNewTab,
  onNewTabInContainer,
  onNewDisposableTab,
  onNewPrivateTab,
  onReopenClosedTab,
  onToggleAI,
  isAiOpen,
  isBookmarked,
  onToggleBookmark,
  onSaveOffline,
  isOfflineSaved,
  onOpenSnapshots,
  // Autocomplete
  history = [],
  bookmarks = [],
  // Zoom
  zoomLevel = 1.0,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSetZoom,
  // Permissions
  sitePermissions,
  defaultPermissions,
  onUpdatePermission,
  onResetSitePermissions,
  // Split View
  onToggleSplitView,
  isSplitView = false,
  // Private mode
  isPrivateMode = false,
  // Screenshot
  onTakeScreenshot,
  onCaptureVisible,
  // VPN
  onToggleVPN,
  isVPNConnected = false,
}) => {
  // State
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSiteInfoOpen, setIsSiteInfoOpen] = useState(false);
  const [isScreenshotMenuOpen, setIsScreenshotMenuOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isSendToDeviceOpen, setIsSendToDeviceOpen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  
  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const sendToDeviceRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const hasCustomPermissions = sitePermissions && Object.keys(sitePermissions.permissions).length > 0;
  const currentOrigin = url.startsWith('http') ? new URL(url).origin : '';

  // Effects
  useEffect(() => {
    setInputValue(url);
    setShowAutocomplete(false);
  }, [url]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };

    if (isShareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isShareMenuOpen]);

  // Close screenshot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsScreenshotMenuOpen(false);
    };

    if (isScreenshotMenuOpen) {
      // Delay to allow the click that opened the menu
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isScreenshotMenuOpen]);

  // Handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onNavigate(inputValue);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div className="h-16 flex items-center px-6 shrink-0 z-20" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-secondary)' }}>
      
      {/* Left Section - Navigation Controls */}
      <div className="flex items-center gap-1 text-zinc-500 shrink-0">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors disabled:opacity-30"
        >
          <ArrowLeft size={16} />
        </button>
        <button 
          onClick={onForward} 
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors disabled:opacity-30"
        >
          <ArrowRight size={16} />
        </button>
        <button 
          onClick={onRefresh} 
          className={`p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors ${isLoading ? 'animate-spin' : ''}`}
        >
          {isLoading ? <X size={16} /> : <RotateCw size={16} />}
        </button>
      </div>

      {/* Center Section - Address Bar */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-2xl relative group">
          <div
            className={`relative flex items-center transition-all duration-300 rounded-xl h-11`}
            style={{
              backgroundColor: isFocused ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              boxShadow: isFocused ? '0 0 0 2px var(--accent-muted)' : 'none'
            }}
          >
            {/* Leading Icon & Container Indicator */}
            <div className="pl-3 pr-2 flex items-center gap-2">
              <button
                className="text-zinc-500 hover:text-white transition-colors"
                onClick={() => setIsSiteInfoOpen(true)}
              >
                {url.startsWith('https') ? (
                  <Lock size={12} className="text-green-500" />
                ) : (
                  <Search size={12} />
                )}
              </button>

              {/* Certificate Viewer - only for HTTPS sites */}
              {url.startsWith('https') && (
                <div className="relative">
                  <button
                    onClick={() => setIsCertificateOpen(!isCertificateOpen)}
                    className="p-1 rounded-md text-green-500 hover:bg-green-500/10 transition-colors"
                    title="View Certificate"
                  >
                    <ShieldCheck size={12} />
                  </button>
                  
                  {isCertificateOpen && (
                    <CertificateViewer
                      url={url}
                      isOpen={isCertificateOpen}
                      onClose={() => setIsCertificateOpen(false)}
                    />
                  )}
                </div>
              )}

              {/* Permissions Indicator - shows when site has custom permissions */}
              {currentOrigin && defaultPermissions && onUpdatePermission && (
                <div className="relative">
                  <button
                    onClick={() => setIsPermissionsOpen(!isPermissionsOpen)}
                    className={`p-1 rounded-md transition-colors ${
                      hasCustomPermissions
                        ? 'text-blue-400 hover:bg-blue-500/10'
                        : 'text-zinc-500 hover:text-white hover:bg-white/10'
                    }`}
                    title="Site Permissions"
                  >
                    <Shield size={12} />
                  </button>
                  
                  {isPermissionsOpen && (
                    <PermissionsPopup
                      origin={currentOrigin}
                      sitePermissions={sitePermissions}
                      defaultPermissions={defaultPermissions}
                      onUpdatePermission={onUpdatePermission}
                      onResetSitePermissions={onResetSitePermissions || (() => {})}
                      onClose={() => setIsPermissionsOpen(false)}
                    />
                  )}
                </div>
              )}

              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-default shadow-[0_0_5px_currentColor]"
                style={{ backgroundColor: `${activeContainer.color}15`, color: activeContainer.color }}
                title={`Container: ${activeContainer.name}`}
              >
                <span className="hidden sm:inline">{activeContainer.name}</span>
              </div>
            </div>

            {/* Private Mode Indicator */}
            {isPrivateMode && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-semibold mr-2">
                <EyeOff size={10} />
                <span>Private</span>
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowAutocomplete(e.target.value.length > 0);
                setAutocompleteIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowAutocomplete(false);
                  return;
                }
                if (showAutocomplete) {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    // Navigation handled by autocomplete component
                    return;
                  }
                }
                handleKeyDown(e);
              }}
              onFocus={() => {
                setIsFocused(true);
                if (inputValue.length > 0) setShowAutocomplete(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                // Delay hiding to allow click on autocomplete item
                setTimeout(() => setShowAutocomplete(false), 200);
              }}
              className="flex-1 w-full bg-transparent border-none text-xs text-white py-2 focus:outline-none placeholder:text-zinc-600 font-sans tracking-wide"
              placeholder="Search or enter website"
            />

            {/* Autocomplete Dropdown */}
            {showAutocomplete && inputValue.length > 0 && (
              <AddressBarAutocomplete
                query={inputValue}
                history={history}
                bookmarks={bookmarks}
                onSelect={(suggestion) => {
                  setInputValue(suggestion.url);
                  onNavigate(suggestion.url);
                  setShowAutocomplete(false);
                  inputRef.current?.blur();
                }}
                onClose={() => setShowAutocomplete(false)}
              />
            )}

            {/* Trailing Actions */}
            <div className="pr-1.5 flex items-center space-x-1">
              {/* Screenshot Button with Dropdown */}
              {!url.startsWith('seran://') && (onTakeScreenshot || onCaptureVisible) && (
                <div className="relative">
                  <button
                    onClick={() => setIsScreenshotMenuOpen(!isScreenshotMenuOpen)}
                    className={`p-1.5 rounded-md transition-all ${
                      isScreenshotMenuOpen 
                        ? 'text-white bg-white/10' 
                        : 'text-zinc-500 hover:text-white hover:bg-white/10'
                    }`}
                    title="Take Screenshot"
                  >
                    <Aperture size={14} />
                  </button>
                  
                  {/* Screenshot Menu Dropdown */}
                  {isScreenshotMenuOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100 z-50 backdrop-blur-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                    >
                      <button
                        onClick={() => {
                          onTakeScreenshot?.();
                          setIsScreenshotMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <span className="text-zinc-500"><Aperture size={14} /></span>
                        Select Area
                      </button>
                      <button
                        onClick={() => {
                          onCaptureVisible?.();
                          setIsScreenshotMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <span className="text-zinc-500"><Camera size={14} /></span>
                        Capture Visible Area
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* QR Code Generator */}
              {!url.startsWith('seran://') && (
                <div className="relative" ref={qrCodeRef}>
                  <button
                    onClick={() => setIsQRCodeOpen(!isQRCodeOpen)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                    title="Generate QR Code"
                  >
                    <QrCode size={14} />
                  </button>
                  
                  <QRCodeGenerator
                    url={url}
                    title={title || 'Current Page'}
                    isOpen={isQRCodeOpen}
                    onClose={() => setIsQRCodeOpen(false)}
                  />
                </div>
              )}

              {/* Send to Device */}
              {!url.startsWith('seran://') && (
                <div className="relative" ref={sendToDeviceRef}>
                  <button
                    onClick={() => setIsSendToDeviceOpen(!isSendToDeviceOpen)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                    title="Send to Device"
                  >
                    <Send size={14} />
                  </button>
                  
                  <SendToDevice
                    url={url}
                    title={title || 'Current Page'}
                    isOpen={isSendToDeviceOpen}
                    onClose={() => setIsSendToDeviceOpen(false)}
                    onShowQRCode={() => setIsQRCodeOpen(true)}
                  />
                </div>
              )}

              {/* Share Button */}
              {!url.startsWith('seran://') && (
                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                    title="Share Page"
                  >
                    <Share2 size={14} />
                  </button>
                  
                  <ShareMenu
                    url={url}
                    title={title || 'Seran Browser'}
                    isOpen={isShareMenuOpen}
                    onClose={() => setIsShareMenuOpen(false)}
                    onShare={(method) => {
                      console.log(`Shared via ${method}`);
                      setIsShareMenuOpen(false);
                    }}
                  />
                </div>
              )}

              {/* Offline Save Button */}
              {!url.startsWith('seran://') && (
                <button
                  onClick={onSaveOffline}
                  disabled={isOfflineSaved}
                  className={`p-1.5 rounded-md transition-all ${
                    isOfflineSaved
                      ? 'text-green-500 cursor-default'
                      : 'text-zinc-500 hover:text-white hover:bg-white/10'
                  }`}
                  title={isOfflineSaved ? "Available Offline" : "Save Page Offline"}
                >
                  {isOfflineSaved ? <Check size={14} /> : <DownloadCloud size={14} />}
                </button>
              )}

              <button
                onClick={onToggleBookmark}
                className={`p-1.5 rounded-md transition-all ${
                  isBookmarked
                    ? 'text-yellow-500 hover:bg-yellow-500/10'
                    : 'text-zinc-500 hover:text-white hover:bg-white/10'
                }`}
              >
                <Star size={14} className={isBookmarked ? "fill-current" : ""} />
              </button>
            </div>
          </div>

          <SiteInfoPopup
            url={url}
            isOpen={isSiteInfoOpen}
            onClose={() => setIsSiteInfoOpen(false)}
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center justify-end gap-2 min-w-fit text-zinc-500">
        {/* Zoom Control - only shows when not at 100% */}
        {onZoomIn && onZoomOut && onZoomReset && onSetZoom && (
          <ZoomControl
            zoomLevel={zoomLevel}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
            onSetZoom={onSetZoom}
          />
        )}

        {/* VPN/Proxy Button */}
        {onToggleVPN && (
          <button
            onClick={onToggleVPN}
            className={`p-2 rounded-lg transition-colors hidden md:block ${
              isVPNConnected 
                ? 'text-green-500 hover:bg-green-500/10' 
                : 'hover:bg-white/5 hover:text-white'
            }`}
            title={isVPNConnected ? 'VPN Connected' : 'VPN/Proxy Settings'}
          >
            {isVPNConnected ? <ShieldCheck size={18} strokeWidth={1.5} /> : <Shield size={18} strokeWidth={1.5} />}
          </button>
        )}

        <button
          onClick={() => onNavigate('seran://extensions')}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors hidden md:block"
          title="Extensions"
        >
          <Puzzle size={18} strokeWidth={1.5} />
        </button>

        <button
          onClick={() => onNavigate('seran://downloads')}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors hidden md:block"
          title="Downloads"
        >
          <Download size={18} strokeWidth={1.5} />
        </button>

        <button
          onClick={onToggleAI}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            isAiOpen
              ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
              : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-white'
          }`}
        >
          <MessageSquare size={14} />
          <span>Ask AI</span>
        </button>

        {/* Profile */}
        <button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 overflow-hidden shrink-0"
          title="Profile"
        >
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User" 
            className="w-full h-full p-0.5 rounded-full" 
          />
        </button>

        {/* Main Menu */}
        <MainMenu 
          ref={menuRef}
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
          onAction={handleMenuAction}
          containers={containers}
          onNewTab={onNewTab}
          onNewDisposableTab={onNewDisposableTab}
          onNewTabInContainer={onNewTabInContainer}
          onNewPrivateTab={onNewPrivateTab}
          onReopenClosedTab={onReopenClosedTab}
          onNavigate={onNavigate}
          onOpenSnapshots={onOpenSnapshots}
          onToggleSplitView={onToggleSplitView}
          isSplitView={isSplitView}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Main Menu Component
// ============================================================================

interface MainMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onAction: (action: () => void) => void;
  containers: Container[];
  onNewTab: () => void;
  onNewDisposableTab: () => void;
  onNewTabInContainer: (containerId: string) => void;
  onNewPrivateTab?: () => void;
  onReopenClosedTab?: () => void;
  onNavigate: (url: string) => void;
  onOpenSnapshots?: () => void;
  onToggleSplitView?: () => void;
  isSplitView?: boolean;
}

const MainMenu = React.forwardRef<HTMLDivElement, MainMenuProps>(
  ({ isOpen, onToggle, onAction, containers, onNewTab, onNewDisposableTab, onNewTabInContainer, onNewPrivateTab, onReopenClosedTab, onNavigate, onOpenSnapshots, onToggleSplitView, isSplitView }, ref) => {
    
    const getContainerIconForMenu = (iconName: string) => {
      switch (iconName) {
        case 'Briefcase': return <Briefcase size={12} />;
        case 'DollarSign': return <DollarSign size={12} />;
        case 'ShoppingBag': return <ShoppingBag size={12} />;
        default: return <User size={12} />;
      }
    };

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={onToggle}
          className={`p-2 hover:text-white hover:bg-white/5 rounded-lg transition-colors ${isOpen ? 'bg-white/5 text-white' : ''}`}
        >
          <MoreHorizontal size={20} strokeWidth={1.5} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-3 w-64 max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50 font-sans backdrop-blur-xl scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
            
            {/* New Tab Actions */}
            <div className="px-1 space-y-0.5">
              <MenuItem icon={<Plus size={16} />} label="New Tab" shortcut="Ctrl+T" onClick={() => onAction(onNewTab)} />
              {onNewPrivateTab && (
                <MenuItem 
                  icon={<EyeOff size={16} className="text-purple-400" />} 
                  label="New Private Tab" 
                  shortcut="Ctrl+Shift+N"
                  onClick={() => onAction(onNewPrivateTab)}
                  variant="purple"
                />
              )}
              <MenuItem 
                icon={<ShieldAlert size={16} className="text-red-500" />} 
                label="New Disposable Tab" 
                onClick={() => onAction(onNewDisposableTab)}
                variant="danger"
              />
              {onReopenClosedTab && (
                <MenuItem 
                  icon={<RotateCcw size={16} />} 
                  label="Reopen Closed Tab" 
                  shortcut="Ctrl+Shift+T"
                  onClick={() => onAction(onReopenClosedTab)}
                />
              )}
            </div>

            <MenuDivider />

            {/* Quick Links */}
            <div className="px-1 space-y-0.5">
              <MenuItem 
                icon={<Camera size={16} />} 
                label="Workspace Snapshots" 
                onClick={() => onAction(() => onOpenSnapshots?.())} 
              />
              <MenuItem 
                icon={<DownloadCloud size={16} />} 
                label="Reading List" 
                onClick={() => onAction(() => onNavigate('seran://offline'))} 
              />
              <MenuItem 
                icon={<Download size={16} />} 
                label="Downloads" 
                onClick={() => onAction(() => onNavigate('seran://downloads'))} 
              />
            </div>

            <MenuDivider />

            {/* Screenshot, Print & PDF */}
            <div className="px-1 space-y-0.5">
              <MenuItem 
                icon={<Aperture size={16} />} 
                label="Take Screenshot" 
                onClick={() => onAction(async () => {
                  const electron = (window as any).electron;
                  if (electron?.screenshot?.captureVisible) {
                    try {
                      const result = await electron.screenshot.captureVisible();
                      if (result.success) {
                        await electron.screenshot.saveWithDialog(result.dataUrl, `screenshot-${Date.now()}.png`);
                      }
                    } catch (err) {
                      console.error('Screenshot failed:', err);
                    }
                  }
                })} 
              />
              <MenuItem 
                icon={<Printer size={16} />} 
                label="Print Page" 
                shortcut="Ctrl+P"
                onClick={() => onAction(async () => {
                  const electron = (window as any).electron;
                  if (electron?.print?.printPage) {
                    await electron.print.printPage();
                  }
                })} 
              />
              <MenuItem 
                icon={<FileText size={16} />} 
                label="Save as PDF" 
                onClick={() => onAction(async () => {
                  const electron = (window as any).electron;
                  if (electron?.print?.savePDF) {
                    await electron.print.savePDF({ showInFolder: true });
                  }
                })} 
              />
              <MenuItem 
                icon={<Code size={16} />} 
                label="Developer Tools" 
                shortcut="F12"
                onClick={() => onAction(() => {
                  const webview = (window as any).__activeWebview;
                  if (webview?.openDevTools) {
                    webview.openDevTools();
                  }
                })} 
              />
              <MenuItem 
                icon={<Maximize size={16} />} 
                label="Full Screen" 
                shortcut="F11"
                onClick={() => onAction(() => {
                  const electron = (window as any).electron;
                  if (electron?.toggleFullscreen) {
                    electron.toggleFullscreen();
                  }
                })} 
              />
              <MenuItem 
                icon={<PictureInPicture2 size={16} />} 
                label="Picture in Picture" 
                onClick={() => onAction(async () => {
                  const webview = (window as any).__activeWebview;
                  if (webview?.requestPictureInPicture) {
                    await webview.requestPictureInPicture();
                  }
                })} 
              />
              {onToggleSplitView && (
                <MenuItem 
                  icon={<SplitSquareHorizontal size={16} />} 
                  label={isSplitView ? "Exit Split View" : "Split View"} 
                  onClick={() => onAction(onToggleSplitView)} 
                />
              )}
            </div>

            <MenuDivider />

            {/* Container Section */}
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              Open in Container
            </div>
            <div className="px-1 space-y-0.5">
              {containers.filter(c => !c.isDisposable).map(c => (
                <button
                  key={c.id}
                  onClick={() => onAction(() => onNewTabInContainer(c.id))}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_5px_currentColor]" 
                    style={{ backgroundColor: c.color, color: 'white' }}
                  >
                    <span className="text-white" style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))' }}>
                      {getContainerIconForMenu(c.icon)}
                    </span>
                  </div>
                  {c.name}
                </button>
              ))}
            </div>

            <MenuDivider />

            {/* Navigation */}
            <div className="px-1 space-y-0.5">
              <MenuItem 
                icon={<History size={16} />} 
                label="History" 
                onClick={() => onAction(() => onNavigate('seran://history'))} 
              />
              <MenuItem 
                icon={<Puzzle size={16} />} 
                label="Extensions" 
                onClick={() => onAction(() => onNavigate('seran://extensions'))} 
              />
              <MenuItem icon={<Star size={16} />} label="Bookmarks" onClick={() => {}} />
            </div>

            <MenuDivider />

            {/* Settings */}
            <div className="px-1 space-y-0.5">
              <MenuItem 
                icon={<Settings size={16} />} 
                label="Settings" 
                onClick={() => onAction(() => onNavigate('seran://settings'))} 
              />
            </div>

            <MenuDivider />

            <div className="px-1">
              <MenuItem icon={<HelpCircle size={16} />} label="Help" onClick={() => {}} />
            </div>
          </div>
        )}
      </div>
    );
  }
);

MainMenu.displayName = 'MainMenu';

// ============================================================================
// Menu Item Helper
// ============================================================================

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'purple';
  shortcut?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, variant = 'default', shortcut }) => {
  const variantClasses = {
    default: 'text-zinc-300 hover:text-white hover:bg-white/10',
    danger: 'text-red-400 hover:bg-red-500/10 hover:text-red-300',
    purple: 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
  };

  return (
    <button 
      onClick={onClick} 
      className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${variantClasses[variant]}`}
    >
      <span className="text-zinc-500">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-zinc-500">{shortcut}</span>}
    </button>
  );
};

const MenuDivider: React.FC = () => <div className="my-1.5 h-px bg-white/5" />;

export default OmniBox;
