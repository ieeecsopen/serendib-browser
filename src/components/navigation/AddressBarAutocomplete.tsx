/**
 * AddressBarAutocomplete Component
 * 
 * Shows suggestions from history, bookmarks, and search as user types
 */

import React, { useState, useEffect, useMemo } from 'react';
import { History, Star, Search, Globe, ArrowUpRight } from 'lucide-react';
import type { HistoryItem, Bookmark } from '../../types';

interface Suggestion {
  id: string;
  type: 'history' | 'bookmark' | 'search' | 'url';
  title: string;
  url: string;
  favicon?: string;
  timestamp?: number;
}

interface AddressBarAutocompleteProps {
  query: string;
  isOpen: boolean;
  history: HistoryItem[];
  bookmarks: Bookmark[];
  onSelect: (url: string) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

const MAX_SUGGESTIONS = 8;

export const AddressBarAutocomplete: React.FC<AddressBarAutocompleteProps> = ({
  query,
  isOpen,
  history,
  bookmarks,
  onSelect,
  onClose,
  selectedIndex,
  onSelectedIndexChange,
}) => {
  const suggestions = useMemo(() => {
    if (!query || query.length < 1) return [];

    const lowerQuery = query.toLowerCase();
    const results: Suggestion[] = [];
    const seenUrls = new Set<string>();

    // Check if query looks like a URL
    const isLikelyUrl = query.includes('.') && !query.includes(' ');
    
    // If it looks like a URL, suggest completing it
    if (isLikelyUrl && !query.startsWith('http')) {
      results.push({
        id: 'url-complete',
        type: 'url',
        title: `https://${query}`,
        url: `https://${query}`,
      });
    }

    // Search bookmarks first (higher priority)
    for (const bookmark of bookmarks) {
      if (results.length >= MAX_SUGGESTIONS) break;
      
      const matchesTitle = bookmark.title.toLowerCase().includes(lowerQuery);
      const matchesUrl = bookmark.url.toLowerCase().includes(lowerQuery);
      
      if ((matchesTitle || matchesUrl) && !seenUrls.has(bookmark.url)) {
        seenUrls.add(bookmark.url);
        results.push({
          id: `bookmark-${bookmark.id}`,
          type: 'bookmark',
          title: bookmark.title,
          url: bookmark.url,
        });
      }
    }

    // Search history
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    for (const item of sortedHistory) {
      if (results.length >= MAX_SUGGESTIONS) break;
      
      const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
      const matchesUrl = item.url.toLowerCase().includes(lowerQuery);
      
      if ((matchesTitle || matchesUrl) && !seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        results.push({
          id: `history-${item.id}`,
          type: 'history',
          title: item.title,
          url: item.url,
          timestamp: item.timestamp,
        });
      }
    }

    // Add search suggestion at the end
    if (results.length < MAX_SUGGESTIONS && !isLikelyUrl) {
      results.push({
        id: 'search',
        type: 'search',
        title: `Search for "${query}"`,
        url: query,
      });
    }

    return results;
  }, [query, history, bookmarks]);

  // Handle keyboard navigation from parent
  useEffect(() => {
    if (selectedIndex >= suggestions.length) {
      onSelectedIndexChange(Math.max(0, suggestions.length - 1));
    }
  }, [suggestions.length, selectedIndex, onSelectedIndexChange]);

  if (!isOpen || suggestions.length === 0) return null;

  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'bookmark':
        return <Star size={14} className="text-yellow-500" />;
      case 'history':
        return <History size={14} className="text-zinc-400" />;
      case 'search':
        return <Search size={14} className="text-blue-400" />;
      case 'url':
        return <Globe size={14} className="text-green-400" />;
    }
  };

  const formatUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch {
      return url;
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="py-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.url)}
            onMouseEnter={() => onSelectedIndexChange(index)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-white/10'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              {getIcon(suggestion.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{suggestion.title}</p>
              {suggestion.type !== 'search' && (
                <p className="text-xs text-zinc-500 truncate">{formatUrl(suggestion.url)}</p>
              )}
            </div>
            <ArrowUpRight size={14} className="text-zinc-600 shrink-0" />
          </button>
        ))}
      </div>
      
      {/* Keyboard hint */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑↓</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Enter</kbd>
          Go
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
          Close
        </span>
      </div>
    </div>
  );
};

export default AddressBarAutocomplete;
