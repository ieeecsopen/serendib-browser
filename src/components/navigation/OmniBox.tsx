/**
 * OmniBox Component (Address Bar)
 * 
 * Navigation bar with URL input, back/forward/refresh controls,
 * container indicator, bookmarks, and main menu.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Container } from '../../types';
import { SiteInfoPopup } from '../ui/SiteInfoPopup';
import { ZoomControl } from '../ui/ZoomControl';
import { 
  ArrowLeft, ArrowRight, RotateCw, Star, Search, MessageSquare, X, Lock, Puzzle,
  User, Plus, History, Settings, HelpCircle, Download, Briefcase, ShoppingBag, 
  DollarSign, ShieldAlert, DownloadCloud, Check, MoreHorizontal, Camera 
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface OmniBoxProps {
  url: string;
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
  onToggleAI: () => void;
  isAiOpen: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onToggleFocus: () => void;
  onSaveOffline: () => void;
  isOfflineSaved: boolean;
  onOpenSnapshots?: () => void;
  // Zoom controls
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onSetZoom?: (level: number) => void;
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
  onToggleAI,
  isAiOpen,
  isBookmarked,
  onToggleBookmark,
  onSaveOffline,
  isOfflineSaved,
  onOpenSnapshots,
  // Zoom
  zoomLevel = 1.0,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSetZoom,
}) => {
  // State
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSiteInfoOpen, setIsSiteInfoOpen] = useState(false);
  
  // Refs
  const menuRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    setInputValue(url);
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
    <div className="h-16 bg-[#050505] flex items-center px-6 shrink-0 z-20 border-b border-white/5">
      
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
            className={`relative flex items-center transition-all duration-300 ${
              isFocused
                ? 'bg-white/10 ring-1 ring-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                : 'bg-white/5 hover:bg-white/10'
            } rounded-xl h-11`}
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

              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-default shadow-[0_0_5px_currentColor]"
                style={{ backgroundColor: `${activeContainer.color}15`, color: activeContainer.color }}
                title={`Container: ${activeContainer.name}`}
              >
                <span className="hidden sm:inline">{activeContainer.name}</span>
              </div>
            </div>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 w-full bg-transparent border-none text-xs text-white py-2 focus:outline-none placeholder:text-zinc-600 font-sans tracking-wide"
              placeholder="Search or enter website"
            />

            {/* Trailing Actions */}
            <div className="pr-1.5 flex items-center space-x-1">
              {/* Offline Save Button */}
              {!url.startsWith('serendib://') && (
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

        <button
          onClick={() => onNavigate('serendib://extensions')}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors hidden md:block"
          title="Extensions"
        >
          <Puzzle size={18} strokeWidth={1.5} />
        </button>

        <button
          onClick={() => onNavigate('serendib://downloads')}
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
          onNavigate={onNavigate}
          onOpenSnapshots={onOpenSnapshots}
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
  onNavigate: (url: string) => void;
  onOpenSnapshots?: () => void;
}

const MainMenu = React.forwardRef<HTMLDivElement, MainMenuProps>(
  ({ isOpen, onToggle, onAction, containers, onNewTab, onNewDisposableTab, onNewTabInContainer, onNavigate, onOpenSnapshots }, ref) => {
    
    const getContainerIconForMenu = (iconName: string) => {
      switch (iconName) {
        case 'Briefcase': return <Briefcase size={14} />;
        case 'DollarSign': return <DollarSign size={14} />;
        case 'ShoppingBag': return <ShoppingBag size={14} />;
        default: return <User size={14} />;
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
          <div className="absolute right-0 top-full mt-3 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50 font-sans backdrop-blur-xl">
            
            {/* New Tab Actions */}
            <div className="px-1 space-y-0.5">
              <MenuItem icon={<Plus size={16} />} label="New Tab" onClick={() => onAction(onNewTab)} />
              <MenuItem 
                icon={<ShieldAlert size={16} className="text-red-500" />} 
                label="New Disposable Tab" 
                onClick={() => onAction(onNewDisposableTab)}
                variant="danger"
              />
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
                onClick={() => onAction(() => onNavigate('serendib://offline'))} 
              />
              <MenuItem 
                icon={<Download size={16} />} 
                label="Downloads" 
                onClick={() => onAction(() => onNavigate('serendib://downloads'))} 
              />
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
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_5px_currentColor]" 
                    style={{ backgroundColor: c.color, color: c.color }}
                  >
                    {getContainerIconForMenu(c.icon)}
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
                onClick={() => onAction(() => onNavigate('serendib://history'))} 
              />
              <MenuItem 
                icon={<Puzzle size={16} />} 
                label="Extensions" 
                onClick={() => onAction(() => onNavigate('serendib://extensions'))} 
              />
              <MenuItem icon={<Star size={16} />} label="Bookmarks" onClick={() => {}} />
            </div>

            <MenuDivider />

            {/* Settings */}
            <div className="px-1 space-y-0.5">
              <MenuItem 
                icon={<Settings size={16} />} 
                label="Settings" 
                onClick={() => onAction(() => onNavigate('serendib://settings'))} 
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
  variant?: 'default' | 'danger';
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, variant = 'default' }) => (
  <button 
    onClick={onClick} 
    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
      variant === 'danger'
        ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
        : 'text-zinc-300 hover:text-white hover:bg-white/10'
    }`}
  >
    <span className="text-zinc-500">{icon}</span>
    {label}
  </button>
);

const MenuDivider: React.FC = () => <div className="my-1.5 h-px bg-white/5" />;

export default OmniBox;
