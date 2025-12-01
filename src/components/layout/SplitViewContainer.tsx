/**
 * SplitViewContainer Component
 * 
 * Renders two webviews side by side with a resizable divider.
 */

import React, { useState, useRef, useCallback } from 'react';
import { X, GripVertical, Maximize2, Minimize2 } from 'lucide-react';

interface SplitViewContainerProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  splitRatio: number;
  onSplitRatioChange: (ratio: number) => void;
  onCloseSplit: () => void;
  leftTitle?: string;
  rightTitle?: string;
}

export const SplitViewContainer: React.FC<SplitViewContainerProps> = ({
  leftContent,
  rightContent,
  splitRatio,
  onSplitRatioChange,
  onCloseSplit,
  leftTitle = 'Left Panel',
  rightTitle = 'Right Panel',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    onSplitRatioChange(clampedRatio);
  }, [isDragging, onSplitRatioChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

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
          <span className="text-xs text-zinc-400 truncate flex-1">{leftTitle}</span>
          <button
            onClick={() => onSplitRatioChange(0.75)}
            className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Expand Left"
          >
            <Maximize2 size={12} />
          </button>
        </div>
        {/* Left Content */}
        <div className="flex-1 relative overflow-hidden">
          {leftContent}
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
          <span className="text-xs text-zinc-400 truncate flex-1">{rightTitle}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSplitRatioChange(0.25)}
              className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Expand Right"
            >
              <Maximize2 size={12} />
            </button>
            <button
              onClick={onCloseSplit}
              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Close Split View"
            >
              <X size={12} />
            </button>
          </div>
        </div>
        {/* Right Content */}
        <div className="flex-1 relative overflow-hidden">
          {rightContent}
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
