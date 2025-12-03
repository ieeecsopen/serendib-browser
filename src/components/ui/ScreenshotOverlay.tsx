/**
 * Screenshot Selection Overlay
 * 
 * Allows users to click and drag to select an area for screenshot capture.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, Camera } from 'lucide-react';

interface ScreenshotOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (rect: { x: number; y: number; width: number; height: number }) => void;
}

export const ScreenshotOverlay: React.FC<ScreenshotOverlayProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate selection rectangle
  const getSelectionRect = useCallback(() => {
    if (!isSelecting && !selection) return null;
    
    const pos = selection || {
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y),
    };
    
    return pos;
  }, [isSelecting, selection, startPos, currentPos]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
    setSelection(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    setCurrentPos({ x, y });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    // Only set selection if it's a meaningful size
    if (width > 10 && height > 10) {
      setSelection({
        x: Math.min(startPos.x, currentPos.x),
        y: Math.min(startPos.y, currentPos.y),
        width,
        height,
      });
    }
    
    setIsSelecting(false);
  };

  const handleCapture = () => {
    if (selection) {
      onCapture(selection);
    }
  };

  const handleReset = () => {
    setSelection(null);
    setIsSelecting(false);
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && selection) {
        handleCapture();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selection, onClose]);

  if (!isOpen) return null;

  const selectionRect = getSelectionRect();

  return (
    <div 
      className="fixed inset-0 z-[200] cursor-crosshair"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/80 text-white text-sm flex items-center gap-2 backdrop-blur-sm">
        <Camera size={16} />
        <span>Click and drag to select an area</span>
        <span className="text-zinc-400 ml-2">Press ESC to cancel</span>
      </div>

      {/* Selection Area */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dark overlay with cutout for selection */}
        {selectionRect && selectionRect.width > 0 && selectionRect.height > 0 && (
          <>
            {/* Selection rectangle - transparent area */}
            <div
              className="absolute border-2 border-blue-500 bg-transparent"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Corner handles */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm" />
              
              {/* Size indicator */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black/80 text-white text-xs whitespace-nowrap">
                {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)}
              </div>
            </div>

            {/* Action buttons - show after selection is complete */}
            {selection && !isSelecting && (
              <div
                className="absolute flex items-center gap-2"
                style={{
                  left: selectionRect.x + selectionRect.width / 2,
                  top: selectionRect.y + selectionRect.height + 40,
                  transform: 'translateX(-50%)',
                }}
              >
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm flex items-center gap-2 transition-colors"
                >
                  <X size={14} />
                  Reset
                </button>
                <button
                  onClick={handleCapture}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center gap-2 transition-colors"
                >
                  <Check size={14} />
                  Capture
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-black/80 hover:bg-black text-white transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default ScreenshotOverlay;
