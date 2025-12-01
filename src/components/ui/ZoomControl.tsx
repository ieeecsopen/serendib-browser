/**
 * Zoom Control Component
 * 
 * Displays current zoom level and provides zoom in/out/reset controls.
 * Appears in the address bar when zoom is not at 100%.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Minus, Plus } from 'lucide-react';

interface ZoomControlProps {
  zoomLevel: number; // 1.0 = 100%
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onSetZoom: (level: number) => void;
}

// Preset zoom levels
const ZOOM_PRESETS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0];

export const ZoomControl: React.FC<ZoomControlProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSetZoom,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const zoomPercent = Math.round(zoomLevel * 100);
  const isDefaultZoom = zoomLevel === 1.0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Only show badge if not at default zoom
  if (isDefaultZoom) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Zoom Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
        title={`Zoom: ${zoomPercent}%`}
      >
        <ZoomIn size={12} />
        <span>{zoomPercent}%</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">Page Zoom</span>
            <button
              onClick={() => {
                onZoomReset();
                setIsOpen(false);
              }}
              className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              disabled={isDefaultZoom}
            >
              <RotateCcw size={10} />
              Reset
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center justify-between bg-zinc-950 rounded-lg p-2">
            <button
              onClick={onZoomOut}
              disabled={zoomLevel <= ZOOM_PRESETS[0]}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus size={16} />
            </button>
            
            <div className="flex-1 text-center">
              <span className="text-lg font-bold text-white">{zoomPercent}%</span>
            </div>
            
            <button
              onClick={onZoomIn}
              disabled={zoomLevel >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="mt-3 grid grid-cols-4 gap-1">
            {[50, 75, 100, 125, 150, 175, 200, 300].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  onSetZoom(preset / 100);
                  if (preset === 100) setIsOpen(false);
                }}
                className={`
                  px-2 py-1.5 text-xs rounded-md transition-colors
                  ${zoomPercent === preset 
                    ? 'bg-white text-black font-medium' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }
                `}
              >
                {preset}%
              </button>
            ))}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="text-[10px] text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>Zoom In</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl +</kbd>
              </div>
              <div className="flex justify-between">
                <span>Zoom Out</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl -</kbd>
              </div>
              <div className="flex justify-between">
                <span>Reset</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl 0</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoomControl;
