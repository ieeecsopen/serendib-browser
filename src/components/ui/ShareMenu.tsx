/**
 * ShareMenu Component
 * 
 * Provides options to share the current page via various methods.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, Copy, Mail, Twitter, Facebook, Linkedin,
  MessageCircle, QrCode, Link2, Check, X, ExternalLink
} from 'lucide-react';

interface ShareMenuProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  url,
  title,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyWithTitle = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`Check out this page:\n\n${title}\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onClose();
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(title);
    const shareUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank', 'width=550,height=420');
    onClose();
  };

  const handleFacebookShare = () => {
    const shareUrl = encodeURIComponent(url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank', 'width=550,height=420');
    onClose();
  };

  const handleLinkedInShare = () => {
    const shareUrl = encodeURIComponent(url);
    const shareTitle = encodeURIComponent(title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank', 'width=550,height=420');
    onClose();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onClose();
  };

  // Generate simple QR code URL (using a free API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

  return (
    <div 
      ref={menuRef}
      className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-white">Share</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Page Info */}
      <div className="px-4 py-3 border-b border-white/5">
        <p className="text-xs text-white font-medium truncate">{title || 'Untitled Page'}</p>
        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{url}</p>
      </div>

      {/* QR Code Section */}
      {showQR ? (
        <div className="p-4 flex flex-col items-center gap-3 border-b border-white/5">
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="w-32 h-32 rounded-lg bg-white p-2"
          />
          <p className="text-[10px] text-zinc-500">Scan to open on mobile</p>
          <button
            onClick={() => setShowQR(false)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Hide QR Code
          </button>
        </div>
      ) : null}

      {/* Share Options */}
      <div className="p-2 space-y-0.5">
        {/* Copy Actions */}
        <ShareButton
          icon={copied ? <Check size={16} className="text-green-400" /> : <Link2 size={16} />}
          label={copied ? "Copied!" : "Copy Link"}
          onClick={handleCopyLink}
        />
        <ShareButton
          icon={<Copy size={16} />}
          label="Copy with Title"
          onClick={handleCopyWithTitle}
        />
        
        <div className="my-2 h-px bg-white/5" />

        {/* Social Sharing */}
        <ShareButton
          icon={<Mail size={16} />}
          label="Email"
          onClick={handleEmailShare}
        />
        <ShareButton
          icon={<Twitter size={16} />}
          label="Twitter / X"
          onClick={handleTwitterShare}
          color="text-sky-400"
        />
        <ShareButton
          icon={<Facebook size={16} />}
          label="Facebook"
          onClick={handleFacebookShare}
          color="text-blue-500"
        />
        <ShareButton
          icon={<Linkedin size={16} />}
          label="LinkedIn"
          onClick={handleLinkedInShare}
          color="text-blue-400"
        />
        <ShareButton
          icon={<MessageCircle size={16} />}
          label="WhatsApp"
          onClick={handleWhatsAppShare}
          color="text-green-400"
        />

        <div className="my-2 h-px bg-white/5" />

        {/* QR Code Toggle */}
        <ShareButton
          icon={<QrCode size={16} />}
          label={showQR ? "Hide QR Code" : "Show QR Code"}
          onClick={() => setShowQR(!showQR)}
        />
      </div>

      {/* Native Share (if available) */}
      {typeof navigator.share === 'function' && (
        <div className="px-4 py-3 border-t border-white/10">
          <button
            onClick={async () => {
              try {
                await navigator.share({ title, url });
                onClose();
              } catch (err) {
                // User cancelled or error
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
            More Sharing Options
          </button>
        </div>
      )}
    </div>
  );
};

// Share Button Component
const ShareButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}> = ({ icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
  >
    <span className={color || 'text-zinc-400'}>{icon}</span>
    {label}
  </button>
);

export default ShareMenu;
