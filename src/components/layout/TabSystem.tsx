/**
 * Tab System Component
 * 
 * Vertical tab sidebar with workspace management, container support,
 * drag-and-drop reordering, and context menus.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Tab, Workspace, Container } from '../../types';
import { 
  X, Plus, Globe, Settings, History, Home, Layers, 
  Briefcase, Newspaper, User, Edit3, Trash2, ArrowRight, 
  Box, ShieldAlert 
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface TabSystemProps {
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
  onNavigateHistory: (tabId: string, index: number) => void;
  onReorderTabs: (draggedTabId: string, targetTabId: string) => void;
  onMoveTabToWorkspace: (tabId: string, targetWorkspaceId: string) => void;
  onCreateWorkspace: () => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onChangeTabContainer: (tabId: string, containerId: string) => void;
  onCreateDisposableTab: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: 'tab' | 'workspace';
  id: string;
}

// ============================================================================
// Helper Components
// ============================================================================

const getWorkspaceIcon = (name: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    personal: <User size={14} />,
    work: <Briefcase size={14} />,
    news: <Newspaper size={14} />,
  };
  return iconMap[name.toLowerCase()] || <Layers size={14} />;
};

const getTabIcon = (url: string) => {
  if (!url.startsWith('serendib://')) return <Globe size={13} />;
  if (url.includes('settings')) return <Settings size={13} />;
  if (url.includes('history')) return <History size={13} />;
  if (url.includes('offline')) return <ArrowRight size={13} />;
  return <Home size={13} />;
};

// ============================================================================
// Main Component
// ============================================================================

export const TabSystem: React.FC<TabSystemProps> = ({
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
  onRenameWorkspace,
  onDeleteWorkspace,
  onChangeTabContainer,
}) => {
  // State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropTargetWorkspace, setDropTargetWorkspace] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState<'tab' | 'workspace' | null>(null);
  
  // Refs
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Handlers
  const handleContextMenu = (e: React.MouseEvent, type: 'tab' | 'workspace', id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const startEditing = (id: string, currentTitle: string, type: 'tab' | 'workspace') => {
    setEditingId(id);
    setEditValue(currentTitle);
    setEditType(type);
    setContextMenu(null);
  };

  const saveEdit = () => {
    if (editingId && editType) {
      if (editType === 'tab') {
        onRenameTab(editingId, editValue);
      } else {
        onRenameWorkspace(editingId, editValue);
      }
      setEditingId(null);
      setEditType(null);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    if (editingId) {
      e.preventDefault();
      return;
    }
    setDraggedTabId(tabId);
    e.dataTransfer.setData('tabId', tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverTab = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTab = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('tabId');
    if (draggedId && draggedId !== targetTabId) {
      onReorderTabs(draggedId, targetTabId);
    }
    setDraggedTabId(null);
  };

  const handleDragOverWorkspace = (e: React.DragEvent, workspaceId: string) => {
    e.preventDefault();
    if (workspaceId !== activeWorkspaceId) {
      setDropTargetWorkspace(workspaceId);
    }
  };

  const handleDropOnWorkspace = (e: React.DragEvent, workspaceId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('tabId');
    if (draggedId && workspaceId !== activeWorkspaceId) {
      onMoveTabToWorkspace(draggedId, workspaceId);
    }
    setDropTargetWorkspace(null);
    setDraggedTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDropTargetWorkspace(null);
  };

  return (
    <>
      <div className="flex flex-col h-full w-[260px] bg-[#050505]/95 backdrop-blur-xl border-r border-white/5 z-10 text-zinc-400 font-sans select-none transition-all duration-300">
        
        {/* Header: Traffic Lights & New Tab Button */}
        <div className="pt-8 pb-4 px-5 flex flex-col gap-5 shrink-0">
          <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition-opacity mb-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 shadow-inner" />
          </div>

          <button
            onClick={onTabCreate}
            className="w-full flex items-center justify-center space-x-2 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200 text-xs font-medium group border border-white/5 shadow-sm"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>New Tab</span>
          </button>
        </div>

        {/* Tabs List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-none py-2">
          {tabs.map((tab) => {
            const container = containers.find(c => c.id === tab.containerId);
            const isActive = activeTabId === tab.id;
            const isEditing = editingId === tab.id && editType === 'tab';
            
            return (
              <div
                key={tab.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, tab.id)}
                onDragOver={handleDragOverTab}
                onDrop={(e) => handleDropOnTab(e, tab.id)}
                onDragEnd={handleDragEnd}
                onClick={() => onTabSelect(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, 'tab', tab.id)}
                className={`
                  group relative flex items-center h-9 px-3 rounded-lg cursor-pointer transition-all duration-200
                  ${isActive ? 'bg-white/10 text-white shadow-md backdrop-blur-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
                  ${draggedTabId === tab.id ? 'opacity-30' : ''}
                `}
              >
                {/* Container Indicator */}
                {container && (
                  <div
                    className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full shadow-[0_0_5px_currentColor] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    style={{ backgroundColor: container.color, color: container.color }}
                    title={container.name}
                  />
                )}

                {/* Icon */}
                <div className={`mr-3 ml-1 shrink-0 ${isActive ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                  {getTabIcon(tab.url)}
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
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 bg-transparent text-xs font-medium focus:outline-none text-white border-b border-white/20 pb-0.5"
                  />
                ) : (
                  <div className="flex-1 min-w-0 flex items-center">
                    <span
                      className="truncate text-[13px] font-medium leading-none flex-1 mt-0.5"
                      onDoubleClick={() => startEditing(tab.id, tab.title, 'tab')}
                    >
                      {tab.title || 'New Tab'}
                    </span>
                    {container?.isDisposable && (
                      <span title="Disposable Tab" className="ml-1.5 shrink-0">
                        <ShieldAlert size={10} className="text-red-500" />
                      </span>
                    )}
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="absolute right-2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 mt-auto border-t border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
              {workspaces.map((ws) => {
                const isEditing = editingId === ws.id && editType === 'workspace';
                
                return isEditing ? (
                  <input
                    key={ws.id}
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 min-w-[60px] h-[32px] px-2 bg-white/5 text-white text-xs rounded-lg focus:outline-none border border-white/10"
                  />
                ) : (
                  <button
                    key={ws.id}
                    onClick={() => onWorkspaceSelect(ws.id)}
                    onContextMenu={(e) => handleContextMenu(e, 'workspace', ws.id)}
                    onDragOver={(e) => handleDragOverWorkspace(e, ws.id)}
                    onDragLeave={() => setDropTargetWorkspace(null)}
                    onDrop={(e) => handleDropOnWorkspace(e, ws.id)}
                    className={`
                      h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-300 relative shrink-0
                      ${activeWorkspaceId === ws.id 
                        ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5' 
                        : dropTargetWorkspace === ws.id 
                          ? 'bg-white/10 text-white ring-1 ring-blue-500' 
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }
                    `}
                    title={ws.name}
                  >
                    {getWorkspaceIcon(ws.name)}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onCreateWorkspace}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-white/5 transition-colors shrink-0"
              title="Create Workspace"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
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
          onRenameTab={(id, title) => startEditing(id, title, 'tab')}
          onRenameWorkspace={(id, title) => startEditing(id, title, 'workspace')}
          onCloseTab={onTabClose}
          onDeleteWorkspace={onDeleteWorkspace}
          onChangeTabContainer={onChangeTabContainer}
          onMoveTabToWorkspace={onMoveTabToWorkspace}
        />
      )}
    </>
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
  onRenameWorkspace: (id: string, title: string) => void;
  onCloseTab: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
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
    onRenameWorkspace,
    onCloseTab, 
    onDeleteWorkspace, 
    onChangeTabContainer,
    onMoveTabToWorkspace 
  }, ref) => {
    
    if (contextMenu.type === 'tab') {
      const tab = tabs.find(t => t.id === contextMenu.id);
      if (!tab) return null;

      return (
        <div
          ref={ref}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 flex flex-col text-zinc-300 backdrop-blur-xl"
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
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
              Reopen in Container
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
                  className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" 
                  style={{ backgroundColor: c.color, color: c.color }} 
                />
                <span className="flex-1 text-left">{c.name}</span>
                {tab.containerId === c.id && <Box size={10} />}
              </button>
            ))}
            <button
              onClick={() => { onChangeTabContainer(tab.id, `cont-disp-${Date.now()}`); onClose(); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors mt-1"
            >
              <ShieldAlert size={12} className="text-red-500" />
              <span className="flex-1 text-left">Convert to Disposable</span>
            </button>
          </div>

          {/* Move to Workspace */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
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

    // Workspace context menu
    const ws = workspaces.find(w => w.id === contextMenu.id);
    if (!ws) return null;

    return (
      <div
        ref={ref}
        style={{ top: contextMenu.y, left: contextMenu.x }}
        className="fixed z-50 w-48 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 flex flex-col text-zinc-300 backdrop-blur-xl"
      >
        <ContextMenuItem 
          icon={<Edit3 size={12} />} 
          label="Rename"
          onClick={() => onRenameWorkspace(ws.id, ws.name)}
        />
        <ContextMenuItem 
          icon={<Trash2 size={12} />} 
          label="Delete"
          variant="danger"
          onClick={() => { onDeleteWorkspace(ws.id); onClose(); }}
        />
      </div>
    );
  }
);

TabContextMenu.displayName = 'TabContextMenu';

// Context Menu Item Helper
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

export default TabSystem;
