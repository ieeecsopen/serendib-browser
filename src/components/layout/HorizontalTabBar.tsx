/**
 * Horizontal Tab Bar Component
 * 
 * Top tab strip with container support, drag-and-drop reordering,
 * context menus, and workspace switcher.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Tab, Workspace, Container } from '../../types';
import { 
  X, Plus, Globe, Settings, History, Home, Layers, 
  Briefcase, Newspaper, User, Edit3, Trash2, ArrowRight, 
  Box, ShieldAlert, RotateCw, ChevronDown, Pin, PinOff, Volume2, VolumeX
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface HorizontalTabBarProps {
  tabs: Tab[];
  activeTabId: string;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  containers: Container[];
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabCreate: () => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onWorkspaceSelect: (id: string) => void;
  onReorderTabs: (draggedTabId: string, targetTabId: string) => void;
  onMoveTabToWorkspace: (tabId: string, targetWorkspaceId: string) => void;
  onCreateWorkspace: () => void;
  onChangeTabContainer: (tabId: string, containerId: string) => void;
  onCreateDisposableTab: () => void;
  onTogglePinTab?: (tabId: string) => void;
  onToggleMuteTab?: (tabId: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  tabId: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getWorkspaceIcon = (name: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    personal: <User size={12} />,
    work: <Briefcase size={12} />,
    news: <Newspaper size={12} />,
  };
  return iconMap[name.toLowerCase()] || <Layers size={12} />;
};

const getTabIcon = (url: string, isLoading: boolean) => {
  if (isLoading) return <RotateCw size={12} className="animate-spin" />;
  if (!url.startsWith('serendib://')) return <Globe size={12} />;
  if (url.includes('settings')) return <Settings size={12} />;
  if (url.includes('history')) return <History size={12} />;
  return <Home size={12} />;
};

// ============================================================================
// Main Component
// ============================================================================

export const HorizontalTabBar: React.FC<HorizontalTabBarProps> = ({
  tabs,
  activeTabId,
  workspaces,
  activeWorkspaceId,
  containers,
  onTabSelect,
  onTabClose,
  onTabCreate,
  onRenameTab,
  onWorkspaceSelect,
  onReorderTabs,
  onMoveTabToWorkspace,
  onCreateWorkspace,
  onChangeTabContainer,
  onCreateDisposableTab,
  onTogglePinTab,
  onToggleMuteTab,
}) => {
  // State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  
  // Refs
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Get active workspace
  const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  // Handlers
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const startEditing = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditValue(currentTitle);
    setContextMenu(null);
  };

  const saveEdit = () => {
    if (editingTabId) {
      onRenameTab(editingTabId, editValue);
      setEditingTabId(null);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    if (editingTabId) {
      e.preventDefault();
      return;
    }
    setDraggedTabId(tabId);
    e.dataTransfer.setData('tabId', tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('tabId');
    if (draggedId && draggedId !== targetTabId) {
      onReorderTabs(draggedId, targetTabId);
    }
    setDraggedTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
  };

  return (
    <div className="flex items-center h-10 bg-[#0A0A0A] border-b border-white/5 shrink-0 select-none">
      
      {/* Workspace Switcher */}
      <div className="relative" ref={workspaceMenuRef}>
        <button
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="flex items-center gap-2 h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border-r border-white/5"
        >
          {activeWorkspace && getWorkspaceIcon(activeWorkspace.name)}
          <span className="hidden sm:inline">{activeWorkspace?.name || 'Workspace'}</span>
          <ChevronDown size={12} className={`transition-transform ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isWorkspaceMenuOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              Workspaces
            </div>
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => {
                  onWorkspaceSelect(ws.id);
                  setIsWorkspaceMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  ws.id === activeWorkspaceId 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {getWorkspaceIcon(ws.name)}
                <span className="flex-1 text-left">{ws.name}</span>
                {ws.id === activeWorkspaceId && <Box size={10} />}
              </button>
            ))}
            <div className="my-1.5 h-px bg-white/5" />
            <button
              onClick={() => {
                onCreateWorkspace();
                setIsWorkspaceMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Plus size={12} />
              <span>New Workspace</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Container */}
      <div 
        ref={tabsContainerRef}
        className="flex-1 flex items-center gap-0.5 px-1 overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const container = containers.find(c => c.id === tab.containerId);
          const isActive = activeTabId === tab.id;
          const isEditing = editingTabId === tab.id;
          const isDragging = draggedTabId === tab.id;
          
          return (
            <div
              key={tab.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onTabSelect(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              className={`
                group relative flex items-center h-8 px-3 rounded-lg cursor-pointer transition-all min-w-[120px] max-w-[200px]
                ${isActive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }
                ${isDragging ? 'opacity-50' : ''}
              `}
            >
              {/* Container Indicator Line */}
              {container && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-opacity"
                  style={{ backgroundColor: container.color }}
                />
              )}

              {/* Favicon / Icon */}
              <div className={`mr-2 shrink-0 ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                {tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-3 h-3 rounded-sm" />
                ) : (
                  getTabIcon(tab.url, tab.isLoading)
                )}
              </div>

              {/* Title / Edit Input */}
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingTabId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 bg-transparent text-xs font-medium focus:outline-none text-white"
                />
              ) : (
                <div className="flex-1 min-w-0 flex items-center">
                  <span
                    className="truncate text-xs font-medium leading-none"
                    onDoubleClick={() => startEditing(tab.id, tab.title)}
                  >
                    {tab.title || 'New Tab'}
                  </span>
                  {container?.isDisposable && (
                    <ShieldAlert size={10} className="ml-1 text-red-500 shrink-0" />
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={`ml-1 p-0.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-all ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <div className="flex items-center gap-1 px-2 border-l border-white/5">
        <button
          onClick={onTabCreate}
          className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          title="New Tab"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={onCreateDisposableTab}
          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="New Disposable Tab"
        >
          <ShieldAlert size={14} />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <TabContextMenu
          ref={contextMenuRef}
          contextMenu={contextMenu}
          tabs={tabs}
          workspaces={workspaces}
          containers={containers}
          activeWorkspaceId={activeWorkspaceId}
          onClose={() => setContextMenu(null)}
          onRenameTab={(id, title) => startEditing(id, title)}
          onCloseTab={onTabClose}
          onChangeTabContainer={onChangeTabContainer}
          onMoveTabToWorkspace={onMoveTabToWorkspace}
        />
      )}
    </div>
  );
};

// ============================================================================
// Context Menu Component
// ============================================================================

interface TabContextMenuProps {
  contextMenu: ContextMenuState;
  tabs: Tab[];
  workspaces: Workspace[];
  containers: Container[];
  activeWorkspaceId: string;
  onClose: () => void;
  onRenameTab: (id: string, title: string) => void;
  onCloseTab: (id: string) => void;
  onChangeTabContainer: (tabId: string, containerId: string) => void;
  onMoveTabToWorkspace: (tabId: string, workspaceId: string) => void;
}

const TabContextMenu = React.forwardRef<HTMLDivElement, TabContextMenuProps>(
  ({ 
    contextMenu, 
    tabs, 
    workspaces, 
    containers, 
    activeWorkspaceId,
    onClose, 
    onRenameTab, 
    onCloseTab, 
    onChangeTabContainer,
    onMoveTabToWorkspace 
  }, ref) => {
    
    const tab = tabs.find(t => t.id === contextMenu.tabId);
    if (!tab) return null;

    return (
      <div
        ref={ref}
        style={{ top: contextMenu.y, left: contextMenu.x }}
        className="fixed z-50 w-56 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 text-zinc-300 backdrop-blur-xl"
      >
        {/* Tab Actions */}
        <div className="pb-1.5 mb-1.5 border-b border-white/5 space-y-0.5">
          <ContextMenuItem 
            icon={<Edit3 size={12} />} 
            label="Rename Tab"
            onClick={() => onRenameTab(tab.id, tab.title)}
          />
          <ContextMenuItem 
            icon={<Trash2 size={12} />} 
            label="Close Tab"
            variant="danger"
            onClick={() => { onCloseTab(tab.id); onClose(); }}
          />
        </div>

        {/* Container Selection */}
        <div className="pb-1.5 mb-1.5 border-b border-white/5">
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
            Container
          </div>
          {containers.filter(c => !c.isDisposable).map(c => (
            <button
              key={c.id}
              onClick={() => { onChangeTabContainer(tab.id, c.id); onClose(); }}
              disabled={tab.containerId === c.id}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                tab.containerId === c.id 
                  ? 'text-zinc-600 cursor-default bg-white/5' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: c.color }} 
              />
              <span className="flex-1 text-left">{c.name}</span>
              {tab.containerId === c.id && <Box size={10} />}
            </button>
          ))}
          <button
            onClick={() => { onChangeTabContainer(tab.id, `cont-disp-${Date.now()}`); onClose(); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
          >
            <ShieldAlert size={12} className="text-red-500" />
            <span className="flex-1 text-left">Make Disposable</span>
          </button>
        </div>

        {/* Move to Workspace */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
            Move to Workspace
          </div>
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => { onMoveTabToWorkspace(tab.id, ws.id); onClose(); }}
              disabled={ws.id === activeWorkspaceId}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                ws.id === activeWorkspaceId 
                  ? 'text-zinc-600 cursor-not-allowed' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {getWorkspaceIcon(ws.name)}
              <span className="flex-1 text-left">{ws.name}</span>
              {ws.id !== activeWorkspaceId && <ArrowRight size={10} />}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

TabContextMenu.displayName = 'TabContextMenu';

// ============================================================================
// Context Menu Item
// ============================================================================

interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
  onClick: () => void;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, label, variant = 'default', onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
      variant === 'danger' 
        ? 'hover:bg-red-500/10 hover:text-red-400' 
        : 'hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="text-zinc-500">{icon}</span>
    {label}
  </button>
);

export default HorizontalTabBar;
