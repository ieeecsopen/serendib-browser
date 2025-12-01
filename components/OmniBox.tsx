import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Star, Shield, Search, Menu, MessageSquare, Maximize2, X, Lock, Puzzle, User, Plus, History, Settings, Printer, HelpCircle, Download, Briefcase, ShoppingBag, DollarSign, ShieldAlert, Box, DownloadCloud, Check, MoreHorizontal } from 'lucide-react';
import { Container } from '../types';
import { SiteInfoPopup } from './BrowserUI';

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

  // Offline
  onSaveOffline: () => void;
  isOfflineSaved: boolean;
}

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
  onToggleFocus,
  onSaveOffline,
  isOfflineSaved,
}) => {
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSiteInfoOpen, setIsSiteInfoOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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

  const getContainerIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase size={12} />;
      case 'DollarSign': return <DollarSign size={12} />;
      case 'ShoppingBag': return <ShoppingBag size={12} />;
      case 'Trash2': return <ShieldAlert size={12} />;
      default: return <User size={12} />;
    }
  }

  return (
    <div className="h-16 bg-[#050505] flex items-center px-6 space-x-4 shrink-0 z-20 border-b border-white/5">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1 text-zinc-500">
        <button onClick={onBack} className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors disabled:opacity-30">
          <ArrowLeft size={16} />
        </button>
        <button onClick={onForward} className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors disabled:opacity-30">
          <ArrowRight size={16} />
        </button>
        <button onClick={onRefresh} className={`p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors ${isLoading ? 'animate-spin' : ''}`}>
          {isLoading ? <X size={16} /> : <RotateCw size={16} />}
        </button>
      </div>

      {/* Floating Address Bar */}
      <div className="flex-1 max-w-3xl mx-auto relative group">
        <div
          className={`relative flex items-center transition-all duration-300 ${isFocused
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
              {url.startsWith('https') ? <Lock size={12} className="text-green-500" /> : <Search size={12} />}
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
                className={`p-1.5 rounded-md transition-all ${isOfflineSaved
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
              className={`p-1.5 rounded-md transition-all ${isBookmarked
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

      {/* Right Actions */}
      <div className="flex items-center space-x-2 pl-2 text-zinc-500">

        <button
          onClick={() => onNavigate('serendib://extensions')}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors hidden sm:block"
          title="Extensions"
        >
          <Puzzle size={18} strokeWidth={1.5} />
        </button>

        <button
          onClick={() => onNavigate('serendib://downloads')}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-colors hidden sm:block"
          title="Downloads"
        >
          <Download size={18} strokeWidth={1.5} />
        </button>

        <button
          onClick={onToggleAI}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAiOpen
            ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
            : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-white'
            }`}
        >
          <MessageSquare size={14} />
          <span className="hidden lg:inline">Ask AI</span>
        </button>

        <button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 ml-2"
          title="Profile"
        >
          {/* Profile placeholder */}
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full p-0.5 rounded-full" />
        </button>

        {/* Main Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 hover:text-white hover:bg-white/5 rounded-lg transition-colors ${isMenuOpen ? 'bg-white/5 text-white' : ''}`}
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50 font-sans backdrop-blur-xl">

              <div className="px-1 space-y-0.5">
                <button onClick={() => handleMenuAction(onNewTab)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Plus size={16} className="text-zinc-500" /> New Tab
                </button>
                <button onClick={() => handleMenuAction(onNewDisposableTab)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
                  <ShieldAlert size={16} className="text-red-500" /> New Disposable Tab
                </button>
              </div>

              <div className="my-1.5 h-px bg-white/5" />

              <div className="px-1 space-y-0.5">
                <button onClick={() => handleMenuAction(() => onNavigate('serendib://offline'))} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <DownloadCloud size={16} className="text-zinc-500" /> Reading List
                </button>
                <button onClick={() => handleMenuAction(() => onNavigate('serendib://downloads'))} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Download size={16} className="text-zinc-500" /> Downloads
                </button>
              </div>

              <div className="my-1.5 h-px bg-white/5" />

              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Open in Container
              </div>
              <div className="px-1 space-y-0.5">
                {containers.filter(c => !c.isDisposable).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleMenuAction(() => onNewTabInContainer(c.id))}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_5px_currentColor]" style={{ backgroundColor: c.color, color: c.color }}>
                      {getContainerIcon(c.icon)}
                    </div>
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="my-1.5 h-px bg-white/5" />

              <div className="px-1 space-y-0.5">
                <button onClick={() => handleMenuAction(() => onNavigate('serendib://history'))} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <History size={16} className="text-zinc-500" /> History
                </button>
                <button onClick={() => handleMenuAction(() => onNavigate('serendib://extensions'))} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Puzzle size={16} className="text-zinc-500" /> Extensions
                </button>
                <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Star size={16} className="text-zinc-500" /> Bookmarks
                </button>
              </div>

              <div className="my-1.5 h-px bg-white/5" />

              <div className="px-1 space-y-0.5">
                <button onClick={() => handleMenuAction(() => onNavigate('serendib://settings'))} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Settings size={16} className="text-zinc-500" /> Settings
                </button>
              </div>

              <div className="my-1.5 h-px bg-white/5" />

              <div className="px-1">
                <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <HelpCircle size={16} className="text-zinc-500" /> Help
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};