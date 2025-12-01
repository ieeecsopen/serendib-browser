/**
 * SplitViewContainer Component
 * 
 * Renders two webviews side by side with a resizable divider.
 */

import React, { useState, useRef, useCallback } from 'react';
import { X, GripVertical, Maximize2 } from 'lucide-react';
import { WebView } from '../browser/WebView';
import type { Tab, Container } from '../../types';

interface SplitViewContainerProps {
  tabs: Tab[];
  leftTabId: string;
  rightTabId: string;
  containers: Container[];
  onTabTitleChange: (tabId: string, title: string) => void;
  onTabUrlChange: (tabId: string, url: string) => void;
  onTabLoadingChange: (tabId: string, isLoading: boolean) => void;
  onTabFaviconChange: (tabId: string, favicon: string) => void;
  onCloseSplitView: () => void;
}

export const SplitViewContainer: React.FC<SplitViewContainerProps> = ({
  tabs,
  leftTabId,
  rightTabId,
  containers,
  onTabTitleChange,
  onTabUrlChange,
  onTabLoadingChange,
  onTabFaviconChange,
  onCloseSplitView,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);

  const leftTab = tabs.find(t => t.id === leftTabId);
  const rightTab = tabs.find(t => t.id === rightTabId);
  
  const leftContainer = containers.find(c => c.id === leftTab?.containerId) || containers[0];
  const rightContainer = containers.find(c => c.id === rightTab?.containerId) || containers[0];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newRatio = (e.clientX - containerRect.left) / containerRect.width;
    
    // Clamp between 20% and 80%
    const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
    setSplitRatio(clampedRatio);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  if (!leftTab || !rightTab) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <p>Split view tabs not found</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex relative bg-black"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left Panel */}
      <div 
        className="flex flex-col overflow-hidden"
        style={{ width: `${splitRatio * 100}%` }}
      >
        {/* Left Panel Header */}
        <div className="h-8 bg-zinc-900 border-b border-white/10 flex items-center justify-between px-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: leftContainer.color }}
              title={leftContainer.name}
            />
            {leftTab.favicon && (
              <img src={leftTab.favicon} className="w-4 h-4 shrink-0" alt="" />
            )}
            <span className="text-xs text-zinc-400 truncate">{leftTab.title}</span>
          </div>
          <button
            onClick={() => setSplitRatio(0.75)}
            className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Expand Left"
          >
            <Maximize2 size={12} />
          </button>
        </div>
        {/* Left Content - WebView */}
        <div className="flex-1 relative overflow-hidden">
          <WebView
            tab={leftTab}
            isActive={false}
            container={leftContainer}
            onTitleChange={(title) => onTabTitleChange(leftTabId, title)}
            onUrlChange={(url) => onTabUrlChange(leftTabId, url)}
            onLoadingChange={(loading) => onTabLoadingChange(leftTabId, loading)}
            onFaviconChange={(favicon) => onTabFaviconChange(leftTabId, favicon)}
          />
        </div>
      </div>

      {/* Resizable Divider */}
      <div
        className={`w-1.5 bg-zinc-800 hover:bg-blue-500/50 cursor-col-resize flex items-center justify-center transition-colors ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute flex flex-col gap-0.5">
          <GripVertical size={12} className="text-zinc-600" />
        </div>
      </div>

      {/* Right Panel */}
      <div 
        className="flex flex-col overflow-hidden"
        style={{ width: `${(1 - splitRatio) * 100}%` }}
      >
        {/* Right Panel Header */}
        <div className="h-8 bg-zinc-900 border-b border-white/10 flex items-center justify-between px-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: rightContainer.color }}
              title={rightContainer.name}
            />
            {rightTab.favicon && (
              <img src={rightTab.favicon} className="w-4 h-4 shrink-0" alt="" />
            )}
            <span className="text-xs text-zinc-400 truncate">{rightTab.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSplitRatio(0.25)}
              className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Expand Right"
            >
              <Maximize2 size={12} />
            </button>
            <button
              onClick={onCloseSplitView}
              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Close Split View"
            >
              <X size={12} />
            </button>
          </div>
        </div>
        {/* Right Content - WebView */}
        <div className="flex-1 relative overflow-hidden">
          <WebView
            tab={rightTab}
            isActive={false}
            container={rightContainer}
            onTitleChange={(title) => onTabTitleChange(rightTabId, title)}
            onUrlChange={(url) => onTabUrlChange(rightTabId, url)}
            onLoadingChange={(loading) => onTabLoadingChange(rightTabId, loading)}
            onFaviconChange={(favicon) => onTabFaviconChange(rightTabId, favicon)}
          />
        </div>
      </div>

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 cursor-col-resize z-50" />
      )}
    </div>
  );
};

export default SplitViewContainer;
