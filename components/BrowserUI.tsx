
import React, { useState } from 'react';
import { Lock, Shield, Eye, Mic, Camera, MapPin, X, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification } from '../types';

// --- Site Info Popup (Security/Permissions) ---
interface SiteInfoPopupProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SiteInfoPopup: React.FC<SiteInfoPopupProps> = ({ url, isOpen, onClose }) => {
  if (!isOpen) return null;

  const isSecure = url.startsWith('https') || url.startsWith('serendib://');
  const domain = url.startsWith('serendib://') ? 'Serendib Browser' : new URL(url).hostname;

  return (
    <div className="absolute top-12 left-4 w-80 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-zinc-300 font-sans">
      <div className="p-4 border-b border-zinc-900">
        <div className="flex items-center gap-2 mb-1">
           {isSecure ? <Lock size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-red-500" />}
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
      
      <div className="p-2 space-y-1">
         <div className="flex items-center justify-between px-3 py-2 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
               <Camera size={14} className="text-zinc-500" />
               <span className="text-sm">Camera</span>
            </div>
            <span className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">Ask</span>
         </div>
         <div className="flex items-center justify-between px-3 py-2 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
               <Mic size={14} className="text-zinc-500" />
               <span className="text-sm">Microphone</span>
            </div>
            <span className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">Ask</span>
         </div>
         <div className="flex items-center justify-between px-3 py-2 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
               <MapPin size={14} className="text-zinc-500" />
               <span className="text-sm">Location</span>
            </div>
            <span className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">Block</span>
         </div>
      </div>

      <div className="p-3 bg-zinc-900/50 border-t border-zinc-900 rounded-b-xl flex justify-between items-center">
         <div className="text-xs text-zinc-500">Cookies: 14 in use</div>
         <button className="text-xs text-blue-400 hover:underline">Site settings</button>
      </div>

      {/* Overlay Backdrop to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

// --- Find In Page Bar ---
interface FindBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FindBar: React.FC<FindBarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-8 w-80 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl z-40 animate-in slide-in-from-top-2 duration-200 flex items-center p-2 gap-2">
       <input 
         type="text" 
         placeholder="Find in page..." 
         autoFocus
         className="flex-1 bg-zinc-900 border-none rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600"
       />
       <span className="text-xs text-zinc-600 font-mono">0/0</span>
       <div className="h-4 w-px bg-zinc-800"></div>
       <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ChevronUp size={16} /></button>
       <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ChevronDown size={16} /></button>
       <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white ml-1"><X size={16} /></button>
    </div>
  );
};

// --- Notifications Toast System ---
interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
       {notifications.map(n => (
         <div 
           key={n.id} 
           className="pointer-events-auto w-80 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-4 flex gap-3 animate-in slide-in-from-right duration-300"
         >
           <div className="shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
              {n.type === 'error' && <AlertTriangle size={18} className="text-red-500" />}
              {n.type === 'warning' && <AlertTriangle size={18} className="text-yellow-500" />}
              {n.type === 'info' && <Info size={18} className="text-blue-500" />}
           </div>
           <div className="flex-1">
              <h4 className="text-sm font-medium text-zinc-200">{n.title}</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{n.message}</p>
           </div>
           <button onClick={() => onDismiss(n.id)} className="shrink-0 text-zinc-600 hover:text-zinc-400 self-start">
             <X size={14} />
           </button>
         </div>
       ))}
    </div>
  );
};
