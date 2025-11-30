import React, { useState, useRef, useEffect } from 'react';
import { generateCompletion } from '../services/gemini';
import { ChatMessage } from '../types';
import { Send, X, Sparkles, FileText, RefreshCcw, Loader2, Bot, ChevronRight, PenTool } from 'lucide-react';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
}

export const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, currentUrl }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am your intelligent assistant. I can read the page you are currently viewing to help summarize, rewrite, or answer questions.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPageContext = async (url: string): Promise<string> => {
    if (url.startsWith('serendib://')) {
      if (url.includes('newtab')) return "User context: User is on the browser's New Tab page.";
      if (url.includes('settings')) return "User context: User is currently adjusting Browser Settings.";
      if (url.includes('history')) return "User context: User is viewing their Browsing History.";
      return `User context: User is on an internal browser page: ${url}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); 
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const toRemove = doc.querySelectorAll('script, style, noscript, iframe, svg, header, footer, nav');
        toRemove.forEach(n => n.remove());
        const text = doc.body.textContent || "";
        const cleanText = text.replace(/\s+/g, ' ').trim();
        return `Current Page URL: ${url}\n\nPage Content (Truncated):\n${cleanText.substring(0, 8000)}`;
      }
    } catch (error) {
      console.warn("AI Context: Could not fetch page content", error);
    }
    return `User context: User is browsing ${url}. (Note: Direct page content could not be accessed automatically).`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = await getPageContext(currentUrl);
      const responseText = await generateCompletion(input, context);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I encountered an issue generating a response.",
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Connection error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: 'summarize' | 'rewrite' | 'explain') => {
    let userText = "";
    let prompt = "";

    switch (action) {
      case 'summarize':
        userText = "Summarize this page";
        prompt = "Please provide a concise summary of the current page content provided in the context.";
        break;
      case 'rewrite':
        userText = "Rewrite content";
        prompt = "Please rewrite the content of the current page to be more professional, concise, and engaging. Highlight the main points.";
        break;
      case 'explain':
        userText = "Explain concepts";
        prompt = "Please explain the key concepts and main ideas found in the current page content provided in the context.";
        break;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const context = await getPageContext(currentUrl);
      const responseText = await generateCompletion(prompt, context);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Could not analyze content.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[400px] flex flex-col bg-white dark:bg-black border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-30 h-full font-sans animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
             <Sparkles size={14} className="fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">Gemini Assistant</span>
            <span className="text-[10px] text-zinc-500 font-medium">Context Aware</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 mt-1">
                <Bot size={12} className="text-zinc-500" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-none' 
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 mt-1">
                <Sparkles size={12} className="text-zinc-400 animate-pulse" />
              </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-2xl rounded-bl-none flex items-center space-x-2 shadow-sm">
              <Loader2 size={14} className="animate-spin text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Area */}
      <div className="p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        
        {/* Quick Chips */}
        {messages.length < 5 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button 
              onClick={() => handleQuickAction('summarize')}
              disabled={isLoading}
              className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <FileText size={12} className="text-blue-500" /> Summarize
            </button>
            <button 
              onClick={() => handleQuickAction('rewrite')}
              disabled={isLoading}
              className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <PenTool size={12} className="text-purple-500" /> Rewrite
            </button>
             <button 
              onClick={() => handleQuickAction('explain')}
              disabled={isLoading}
              className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <RefreshCcw size={12} className="text-green-500" /> Explain
            </button>
          </div>
        )}

        {/* Input */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI about this page..."
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 dark:text-zinc-100 text-sm resize-none h-12 min-h-[48px] max-h-32 scrollbar-none transition-all placeholder:text-zinc-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-sm"
          >
            <Send size={14} />
          </button>
        </div>
        
        <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-600">
          AI may generate inaccurate information.
        </p>
      </div>
    </div>
  );
};