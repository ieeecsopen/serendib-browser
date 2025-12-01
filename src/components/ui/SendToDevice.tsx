/**
 * SendToDevice Component
 * 
 * Allows sending the current page URL to other connected devices
 * via various methods (push notification, sync, or manual options).
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Smartphone, Laptop, Tablet, Monitor, 
  Send, RefreshCw, Plus, Check, Wifi, WifiOff,
  Mail, MessageSquare, QrCode
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'laptop' | 'desktop';
  lastSeen: number;
  isOnline: boolean;
}

interface SendToDeviceProps {
  url: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  onShowQRCode?: () => void;
}

// Mock devices for demonstration
const MOCK_DEVICES: Device[] = [
  { id: '1', name: 'iPhone 15 Pro', type: 'phone', lastSeen: Date.now(), isOnline: true },
  { id: '2', name: 'iPad Air', type: 'tablet', lastSeen: Date.now() - 300000, isOnline: true },
  { id: '3', name: 'MacBook Pro', type: 'laptop', lastSeen: Date.now() - 3600000, isOnline: false },
  { id: '4', name: 'Home Desktop', type: 'desktop', lastSeen: Date.now() - 86400000, isOnline: false },
];

const getDeviceIcon = (type: Device['type']) => {
  switch (type) {
    case 'phone':
      return <Smartphone size={18} />;
    case 'tablet':
      return <Tablet size={18} />;
    case 'laptop':
      return <Laptop size={18} />;
    case 'desktop':
      return <Monitor size={18} />;
  }
};

const formatLastSeen = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const SendToDevice: React.FC<SendToDeviceProps> = ({
  url,
  title = 'Current Page',
  isOpen,
  onClose,
  onShowQRCode,
}) => {
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate device discovery
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDevices(prev => prev.map(d => ({
      ...d,
      lastSeen: d.isOnline ? Date.now() : d.lastSeen,
    })));
    setIsRefreshing(false);
  };

  const handleSendToDevice = async (device: Device) => {
    setSendingTo(device.id);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real implementation, this would:
    // 1. Use Chrome Sync API
    // 2. Use Push Notifications
    // 3. Use a custom sync server
    
    setSendingTo(null);
    setSentTo(device.id);
    
    setTimeout(() => {
      setSentTo(null);
    }, 3000);
  };

  const handleSendViaEmail = () => {
    const subject = encodeURIComponent(`Check out: ${title}`);
    const body = encodeURIComponent(`I wanted to share this page with you:\n\n${title}\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onClose();
  };

  const handleSendViaSMS = () => {
    // SMS URL scheme
    const message = encodeURIComponent(`${title}\n${url}`);
    window.open(`sms:?body=${message}`, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  const onlineDevices = devices.filter(d => d.isOnline);
  const offlineDevices = devices.filter(d => !d.isOnline);

  return (
    <div 
      ref={containerRef}
      className="absolute top-full right-0 mt-2 w-80 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Send size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Send to Device</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh devices"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Page Info */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <p className="text-xs text-zinc-400 mb-1">Sending</p>
        <p className="text-sm text-white truncate" title={title}>
          {title}
        </p>
        <p className="text-xs text-zinc-500 truncate" title={url}>
          {url}
        </p>
      </div>

      {/* Devices List */}
      <div className="max-h-64 overflow-y-auto">
        {/* Online Devices */}
        {onlineDevices.length > 0 && (
          <div className="p-2">
            <p className="px-2 py-1 text-xs font-medium text-green-400 flex items-center gap-1">
              <Wifi size={10} />
              Online Devices
            </p>
            {onlineDevices.map(device => (
              <button
                key={device.id}
                onClick={() => handleSendToDevice(device)}
                disabled={sendingTo === device.id || sentTo === device.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-white">{device.name}</p>
                  <p className="text-xs text-zinc-500">{formatLastSeen(device.lastSeen)}</p>
                </div>
                <div className="w-6">
                  {sendingTo === device.id && (
                    <RefreshCw size={14} className="text-blue-400 animate-spin" />
                  )}
                  {sentTo === device.id && (
                    <Check size={14} className="text-green-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Offline Devices */}
        {offlineDevices.length > 0 && (
          <div className="p-2 border-t border-white/5">
            <p className="px-2 py-1 text-xs font-medium text-zinc-500 flex items-center gap-1">
              <WifiOff size={10} />
              Offline Devices
            </p>
            {offlineDevices.map(device => (
              <button
                key={device.id}
                onClick={() => handleSendToDevice(device)}
                disabled={sendingTo === device.id || sentTo === device.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors opacity-60 hover:opacity-80"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-zinc-300">{device.name}</p>
                  <p className="text-xs text-zinc-600">{formatLastSeen(device.lastSeen)}</p>
                </div>
                <div className="w-6">
                  {sendingTo === device.id && (
                    <RefreshCw size={14} className="text-blue-400 animate-spin" />
                  )}
                  {sentTo === device.id && (
                    <Check size={14} className="text-green-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Devices */}
        {devices.length === 0 && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Smartphone size={20} className="text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400 mb-1">No devices found</p>
            <p className="text-xs text-zinc-500">Sign in on other devices to sync</p>
          </div>
        )}
      </div>

      {/* Alternative Methods */}
      <div className="p-3 border-t border-white/5 bg-white/[0.02]">
        <p className="text-xs text-zinc-500 mb-2 px-1">Other ways to share</p>
        <div className="flex gap-2">
          <button
            onClick={handleSendViaEmail}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
          >
            <Mail size={14} />
            Email
          </button>
          <button
            onClick={handleSendViaSMS}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
          >
            <MessageSquare size={14} />
            SMS
          </button>
          {onShowQRCode && (
            <button
              onClick={() => {
                onClose();
                onShowQRCode();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
            >
              <QrCode size={14} />
              QR Code
            </button>
          )}
        </div>
      </div>

      {/* Add Device Link */}
      <div className="p-3 border-t border-white/5">
        <button
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-blue-400 hover:bg-blue-500/10 text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={14} />
          Connect a new device
        </button>
      </div>
    </div>
  );
};

export default SendToDevice;
