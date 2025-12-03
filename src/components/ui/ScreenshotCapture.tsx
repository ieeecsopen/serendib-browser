/**
 * Screenshot Capture Component
 * 
 * UI for capturing screenshots with various modes and options.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ScreenshotMode, ScreenshotFormat, ScreenshotResult, ScreenshotSelection } from '../../types/screenshot';
import {
  captureVisibleArea,
  captureFullPage,
  captureSelection,
  downloadScreenshot,
  copyScreenshotToClipboard,
  saveScreenshot,
  formatFileSize,
  estimateDataUrlSize,
} from '../../services/screenshot';
import {
  Camera, Monitor, Maximize, Square, MousePointer, Download,
  Copy, X, Check, Loader2, Image, Crop, Edit3, Share2
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ScreenshotCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture?: (result: ScreenshotResult) => void;
  onNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  /** Current page URL for metadata */
  currentUrl?: string;
  /** Current page title for metadata */
  currentTitle?: string;
}

type CaptureStep = 'select' | 'capturing' | 'preview' | 'selection';

// ============================================================================
// Selection Overlay Component
// ============================================================================

interface SelectionOverlayProps {
  onSelect: (selection: ScreenshotSelection) => void;
  onCancel: () => void;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ onSelect, onCancel }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      setEnd({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const selection: ScreenshotSelection = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      };
      
      if (selection.width > 10 && selection.height > 10) {
        onSelect(selection);
      }
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectionStyle = isDrawing ? {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  } : {};

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] cursor-crosshair"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Selection Rectangle */}
      {isDrawing && (
        <div
          className="absolute border-2 border-white border-dashed"
          style={{
            ...selectionStyle,
            backgroundColor: 'rgba(255,255,255,0.1)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          }}
        />
      )}
      
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/80 text-white text-sm">
        Click and drag to select an area • Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-700 text-xs">Esc</kbd> to cancel
      </div>
      
      {/* Dimensions */}
      {isDrawing && (
        <div
          className="absolute px-2 py-1 rounded bg-black/80 text-white text-xs font-mono"
          style={{
            left: Math.max(end.x, start.x) + 10,
            top: Math.max(end.y, start.y) + 10,
          }}
        >
          {Math.abs(end.x - start.x)} × {Math.abs(end.y - start.y)}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ScreenshotCapture: React.FC<ScreenshotCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  onNotification,
  currentUrl,
  currentTitle,
}) => {
  // State
  const [step, setStep] = useState<CaptureStep>('select');
  const [captureMode, setCaptureMode] = useState<ScreenshotMode>('visible');
  const [format, setFormat] = useState<ScreenshotFormat>('png');
  const [result, setResult] = useState<ScreenshotResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSelectionOverlay, setShowSelectionOverlay] = useState(false);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setResult(null);
      setShowSelectionOverlay(false);
    }
  }, [isOpen]);

  // Capture handlers
  const handleCapture = async () => {
    if (captureMode === 'selection') {
      setShowSelectionOverlay(true);
      onClose(); // Close the menu temporarily
      return;
    }

    setIsCapturing(true);
    setStep('capturing');

    let captureResult: ScreenshotResult;

    try {
      switch (captureMode) {
        case 'fullPage':
          captureResult = await captureFullPage({ format });
          break;
        case 'visible':
        default:
          captureResult = await captureVisibleArea({ format });
          break;
      }

      // Add metadata
      captureResult.sourceUrl = currentUrl;
      captureResult.pageTitle = currentTitle;

      if (captureResult.dataUrl) {
        captureResult.size = estimateDataUrlSize(captureResult.dataUrl);
      }

      setResult(captureResult);
      setStep('preview');
      onCapture?.(captureResult);

      if (captureResult.success) {
        onNotification?.('Screenshot Captured', 'Your screenshot is ready.', 'success');
      } else {
        onNotification?.('Capture Failed', captureResult.error || 'Unknown error', 'error');
      }
    } catch (error: any) {
      onNotification?.('Capture Failed', error.message, 'error');
      setStep('select');
    }

    setIsCapturing(false);
  };

  const handleSelectionCapture = async (selection: ScreenshotSelection) => {
    setShowSelectionOverlay(false);
    setIsCapturing(true);

    const captureResult = await captureSelection(selection, { format });
    captureResult.sourceUrl = currentUrl;
    captureResult.pageTitle = currentTitle;

    if (captureResult.dataUrl) {
      captureResult.size = estimateDataUrlSize(captureResult.dataUrl);
    }

    setResult(captureResult);
    setStep('preview');
    setIsCapturing(false);
    onCapture?.(captureResult);

    if (captureResult.success) {
      onNotification?.('Screenshot Captured', 'Your screenshot is ready.', 'success');
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadScreenshot(result, currentTitle?.replace(/[^a-z0-9]/gi, '-'));
      onNotification?.('Downloaded', 'Screenshot saved to downloads.', 'success');
    }
  };

  const handleCopy = async () => {
    if (result) {
      const success = await copyScreenshotToClipboard(result);
      if (success) {
        onNotification?.('Copied', 'Screenshot copied to clipboard.', 'success');
      } else {
        onNotification?.('Copy Failed', 'Could not copy to clipboard.', 'error');
      }
    }
  };

  const handleSave = () => {
    if (result) {
      saveScreenshot(result, { mode: captureMode, format });
      onNotification?.('Saved', 'Screenshot saved to history.', 'success');
    }
  };

  // Render selection overlay separately
  if (showSelectionOverlay) {
    return (
      <SelectionOverlay
        onSelect={handleSelectionCapture}
        onCancel={() => setShowSelectionOverlay(false)}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-[440px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Screenshot
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {step === 'select' && 'Choose capture mode'}
                {step === 'capturing' && 'Capturing...'}
                {step === 'preview' && 'Preview your screenshot'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Selection */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: 'visible' as const, icon: Monitor, label: 'Visible Area' },
                  { mode: 'fullPage' as const, icon: Maximize, label: 'Full Page' },
                  { mode: 'selection' as const, icon: Crop, label: 'Selection' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setCaptureMode(mode)}
                    className={`p-4 rounded-xl transition-all flex flex-col items-center gap-2 ${
                      captureMode === mode 
                        ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-400' 
                        : 'bg-zinc-800/50 border-2 border-transparent hover:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Format Selection */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  Format
                </label>
                <div className="flex gap-2">
                  {(['png', 'jpeg', 'webp'] as ScreenshotFormat[]).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        format === fmt
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capture Button */}
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isCapturing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Camera size={18} />
                )}
                Capture Screenshot
              </button>
            </div>
          )}

          {/* Capturing State */}
          {step === 'capturing' && (
            <div className="py-8 text-center">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin text-blue-400" />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Capturing screenshot...
              </p>
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && result && (
            <div className="space-y-4">
              {result.success && result.dataUrl ? (
                <>
                  {/* Preview Image */}
                  <div 
                    className="rounded-xl overflow-hidden border"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <img
                      src={result.dataUrl}
                      alt="Screenshot preview"
                      className="w-full h-auto max-h-[300px] object-contain bg-zinc-900"
                    />
                  </div>

                  {/* Info */}
                  <div 
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                  >
                    <span>{result.width} × {result.height}</span>
                    <span>{formatFileSize(result.size || 0)}</span>
                    <span>{format.toUpperCase()}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleDownload}
                      className="py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      onClick={handleCopy}
                      className="py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                    <button
                      onClick={handleSave}
                      className="py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                    >
                      <Image size={16} />
                      Save
                    </button>
                  </div>

                  {/* New Capture */}
                  <button
                    onClick={() => {
                      setStep('select');
                      setResult(null);
                    }}
                    className="w-full py-2 rounded-xl text-sm transition-colors hover:bg-zinc-800"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Take Another Screenshot
                  </button>
                </>
              ) : (
                <div className="py-8 text-center">
                  <X size={48} className="mx-auto mb-4 text-red-400" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {result.error || 'Failed to capture screenshot'}
                  </p>
                  <button
                    onClick={() => setStep('select')}
                    className="mt-4 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenshotCapture;
