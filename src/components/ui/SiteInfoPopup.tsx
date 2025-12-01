/**
 * Site Info Popup Component
 * 
 * Displays security information and permissions for the current site.
 */

import React from 'react';
import { Lock, AlertTriangle, Camera, Mic, MapPin } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SiteInfoPopupProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const SiteInfoPopup: React.FC<SiteInfoPopupProps> = ({ url, isOpen, onClose }) => {
  if (!isOpen) return null;

  const isSecure = url.startsWith('https') || url.startsWith('seran://');
  const domain = url.startsWith('seran://') 
    ? 'Seran Browser' 
    : (() => { try { return new URL(url).hostname; } catch { return url; } })();

  return (
    <div className="absolute top-12 left-4 w-80 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-zinc-300 font-sans">
      
      {/* Security Status */}
      <div className="p-4 border-b border-zinc-900">
        <div className="flex items-center gap-2 mb-1">
          {isSecure ? (
            <Lock size={16} className="text-green-500" />
          ) : (
            <AlertTriangle size={16} className="text-red-500" />
          )}
          <span className={`font-medium ${isSecure ? 'text-green-500' : 'text-red-500'}`}>
            {isSecure ? 'Connection is secure' : 'Not secure'}
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          {isSecure
            ? 'Your information (for example, passwords or credit card numbers) is private when it is sent to this site.'
            : 'You should not enter any sensitive information on this site.'}
        </p>
      </div>

      {/* Permissions */}
      <div className="p-2 space-y-1">
        <PermissionItem icon={<Camera size={14} />} label="Camera" status="Ask" />
        <PermissionItem icon={<Mic size={14} />} label="Microphone" status="Ask" />
        <PermissionItem icon={<MapPin size={14} />} label="Location" status="Block" />
      </div>

      {/* Footer */}
      <div className="p-3 bg-zinc-900/50 border-t border-zinc-900 rounded-b-xl flex justify-between items-center">
        <div className="text-xs text-zinc-500">Cookies: 14 in use</div>
        <button className="text-xs text-blue-400 hover:underline">Site settings</button>
      </div>

      {/* Click-outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

interface PermissionItemProps {
  icon: React.ReactNode;
  label: string;
  status: string;
}

const PermissionItem: React.FC<PermissionItemProps> = ({ icon, label, status }) => (
  <div className="flex items-center justify-between px-3 py-2 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-zinc-500">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
      {status}
    </span>
  </div>
);

export default SiteInfoPopup;
