/**
 * Window Controls Component
 * 
 * Custom window control buttons (minimize, maximize, close) for Electron's frameless window.
 * Only renders in Electron environment.
 */

import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

interface WindowControlsProps {
  className?: string;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ className = '' }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electron) {
        const maximized = await window.electron.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electron?.minimize();
  };

  const handleMaximize = async () => {
    await window.electron?.maximize();
    if (window.electron) {
      const maximized = await window.electron.isMaximized();
      setIsMaximized(maximized);
    }
  };

  const handleClose = () => {
    window.electron?.close();
  };

  // Only show controls in Electron environment
  if (!window.electron) {
    return null;
  }

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <WindowButton onClick={handleMinimize} title="Minimize">
        <Minus size={14} />
      </WindowButton>
      
      <WindowButton onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
        {isMaximized ? <Maximize2 size={12} /> : <Square size={12} />}
      </WindowButton>
      
      <WindowButton onClick={handleClose} title="Close" variant="close">
        <X size={14} />
      </WindowButton>
    </div>
  );
};

interface WindowButtonProps {
  onClick: () => void;
  title: string;
  variant?: 'default' | 'close';
  children: React.ReactNode;
}

const WindowButton: React.FC<WindowButtonProps> = ({ 
  onClick, 
  title, 
  variant = 'default', 
  children 
}) => (
  <button
    onClick={onClick}
    className={`
      w-10 h-8 flex items-center justify-center transition-colors text-zinc-400
      ${variant === 'close' 
        ? 'hover:bg-red-500 hover:text-white' 
        : 'hover:bg-white/10 hover:text-white'
      }
    `}
    title={title}
  >
    {children}
  </button>
);

export default WindowControls;
