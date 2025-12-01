import React from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

interface WindowControlsProps {
  className?: string;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ className = '' }) => {
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
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
      <button
        onClick={handleMinimize}
        className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
        title="Minimize"
      >
        <Minus size={14} className="text-zinc-400" />
      </button>
      <button
        onClick={handleMaximize}
        className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Maximize2 size={12} className="text-zinc-400" />
        ) : (
          <Square size={12} className="text-zinc-400" />
        )}
      </button>
      <button
        onClick={handleClose}
        className="w-10 h-8 flex items-center justify-center hover:bg-red-500 transition-colors group"
        title="Close"
      >
        <X size={14} className="text-zinc-400 group-hover:text-white" />
      </button>
    </div>
  );
};

export default WindowControls;
