import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, History, Terminal } from 'lucide-react';

interface TerminalPromptProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  history: string[];
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  onSubmit,
  isLoading,
  isConnected,
  history
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || isLoading) return;
    
    onSubmit(input.trim());
    setInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const selectFromHistory = (query: string) => {
    setInput(query);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900">
      {/* History dropdown */}
      {showHistory && history.length > 0 && (
        <div className="border-b border-gray-700 bg-gray-800 max-h-40 overflow-y-auto">
          <div className="p-2 text-xs text-gray-400 font-mono border-b border-gray-700">
            Command History ({history.length} entries)
          </div>
          {history.slice(-10).reverse().map((query, index) => (
            <button
              key={index}
              onClick={() => selectFromHistory(query)}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 
                         font-mono truncate transition-colors"
            >
              <span className="text-gray-500 mr-2">$</span>
              {query}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {/* Terminal prompt prefix */}
          <div className="flex items-center gap-2 text-green-400 font-mono text-sm flex-shrink-0">
            <Terminal className="w-4 h-4" />
            <span className="text-gray-400">user@agent</span>
            <span className="text-green-400">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-green-400">$</span>
          </div>

          {/* Input field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected 
                  ? "Enter your query..." 
                  : "Connecting to agent..."
              }
              disabled={!isConnected || isLoading}
              className="w-full bg-transparent text-gray-100 placeholder-gray-500 
                         font-mono text-sm focus:outline-none disabled:opacity-50 
                         disabled:cursor-not-allowed pr-16"
            />
            
            {/* Blinking cursor effect when loading */}
            {isLoading && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <div className="w-2 h-4 bg-green-400 animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 
                           rounded transition-colors"
                title="Command history"
              >
                <History className="w-4 h-4" />
              </button>
            )}
            
            <button
              type="submit"
              disabled={!input.trim() || !isConnected || isLoading}
              className="p-2 text-gray-400 hover:text-green-400 disabled:text-gray-600 
                         disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Status line */}
        <div className="flex items-center justify-between mt-2 text-xs font-mono">
          <div className="flex items-center gap-4 text-gray-500">
            <span>History: {history.length}</span>
            {isLoading && <span className="text-green-400 animate-pulse">Processing...</span>}
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">
              ↑↓
            </kbd>
            <span>history</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">
              Enter
            </kbd>
            <span>send</span>
          </div>
        </div>
      </div>
    </div>
  );
};