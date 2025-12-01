/**
 * Toast Container Component
 * 
 * Notification toast system for displaying alerts, errors, and info messages.
 */

import React from 'react';
import type { Notification } from '../../types';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map(n => (
        <Toast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

// ============================================================================
// Toast Component
// ============================================================================

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'error':
        return <AlertTriangle size={18} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'info':
        return <Info size={18} className="text-blue-500" />;
      default:
        return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="pointer-events-auto w-80 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-4 flex gap-3 animate-in slide-in-from-right duration-300">
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-zinc-200">{notification.title}</h4>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{notification.message}</p>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 text-zinc-600 hover:text-zinc-400 self-start"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ToastContainer;
