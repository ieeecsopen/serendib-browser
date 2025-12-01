/**
 * QRCodeGenerator Component
 * 
 * Generates a QR code for the current page URL that can be scanned
 * by mobile devices for easy sharing.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Copy, Check, Smartphone, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Simple QR Code generation using Canvas
// This creates a basic QR code without external dependencies
const generateQRCode = (text: string, size: number = 200): string => {
  // For a production app, you'd use a proper QR library like 'qrcode'
  // This is a simplified version that creates a visual placeholder
  // and uses an external API for actual QR generation
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=svg`;
};

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  url,
  title = 'Current Page',
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrSize] = useState(200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(generateQRCode(url, 400));
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `qr-code-${new URL(url).hostname}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      // Fallback: open in new tab
      window.open(generateQRCode(url, 400), '_blank');
    }
  };

  if (!isOpen) return null;

  const qrCodeUrl = generateQRCode(url, qrSize);

  return (
    <div 
      ref={containerRef}
      className="absolute top-full right-0 mt-2 w-72 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <QrCode size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">QR Code</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-3 rounded-lg">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            width={qrSize}
            height={qrSize}
            className="block"
          />
        </div>
      </div>

      {/* Page Info */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <p className="text-xs text-zinc-400 mb-1">Page URL</p>
        <p className="text-xs text-white truncate" title={url}>
          {url}
        </p>
      </div>

      {/* Instructions */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Smartphone size={14} className="text-blue-400 shrink-0" />
        <p className="text-xs text-blue-300">
          Scan with your phone's camera to open this page
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy Link
            </>
          )}
        </button>
        <button
          onClick={handleDownloadQR}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Download size={14} />
          Download
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
