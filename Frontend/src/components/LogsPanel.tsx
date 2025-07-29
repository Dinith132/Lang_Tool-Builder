import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff } from 'lucide-react';
import { ChatMessage } from '../types/message';

interface LogsPanelProps {
  messages: ChatMessage[];
  isVisible: boolean;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ messages, isVisible }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ai', 'tool_result']));
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isVisible) return null;

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const copyToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const getLogMessages = () => {
    return messages.filter(msg => msg.type !== 'user');
  };

  const categorizeMessages = () => {
    const logMessages = getLogMessages();
    const categories = {
      ai: logMessages.filter(msg => msg.type === 'ai'),
      tool_result: logMessages.filter(msg => msg.type === 'tool_result'),
      other: logMessages.filter(msg => msg.type === 'other'),
      error: logMessages.filter(msg => msg.type === 'error'),
    };
    return categories;
  };

  const categories = categorizeMessages();

  const getTagConfig = (type: string) => {
    switch (type) {
      case 'ai':
        return { label: 'THOUGHT', color: 'text-cyan-400 bg-cyan-900/30' };
      case 'tool_result':
        return { label: 'TOOL', color: 'text-yellow-400 bg-yellow-900/30' };
      case 'other':
        return { label: 'SYSTEM', color: 'text-gray-400 bg-gray-800/30' };
      case 'error':
        return { label: 'ERROR', color: 'text-red-400 bg-red-900/30' };
      default:
        return { label: 'LOG', color: 'text-gray-400 bg-gray-800/30' };
    }
  };

  const formatLogContent = (content: string, type: string) => {
    if (type === 'ai' && content.includes('```json')) {
      // Extract and format JSON blocks
      const parts = content.split(/(```json[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```json')) {
          const code = part.replace(/```json\n?/, '').replace(/```$/, '');
          return (
            <div key={index} className="my-2">
              <div className="bg-gray-800 border border-gray-600 rounded overflow-hidden">
                <div className="bg-gray-700 px-2 py-1 text-xs text-gray-300 font-mono border-b border-gray-600">
                  Tool Call JSON
                </div>
                <pre className="p-2 text-xs text-gray-200 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          );
        }
        return <span key={index} className="text-xs">{part}</span>;
      });
    }
    return <span className="text-xs">{content}</span>;
  };

  return (
    <div className="border-l border-gray-700 bg-gray-900 w-96 flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono text-gray-200">Agent Reasoning Logs</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="p-1 text-gray-400 hover:text-gray-200 rounded transition-colors"
              title="Toggle raw JSON view"
            >
              {showRawJson ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={() => copyToClipboard(JSON.stringify(getLogMessages(), null, 2))}
              className="p-1 text-gray-400 hover:text-gray-200 rounded transition-colors"
              title="Copy all logs"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 font-mono mt-1">
          {getLogMessages().length} log entries
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {showRawJson ? (
          <pre className="p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap">
            {JSON.stringify(getLogMessages(), null, 2)}
          </pre>
        ) : (
          <div className="p-3 space-y-3">
            {Object.entries(categories).map(([categoryType, categoryMessages]) => {
              if (categoryMessages.length === 0) return null;
              
              const isExpanded = expandedCategories.has(categoryType);
              const { label, color } = getTagConfig(categoryType);

              return (
                <div key={categoryType} className="border border-gray-700 rounded">
                  <button
                    onClick={() => toggleCategory(categoryType)}
                    className="w-full flex items-center justify-between p-2 bg-gray-800 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span className={`px-2 py-1 rounded text-xs font-mono ${color}`}>
                        {label}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({categoryMessages.length})
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-700">
                      {categoryMessages.map((message, index) => (
                        <div key={message.id} className="p-2 border-b border-gray-800 last:border-b-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-mono">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
                            >
                              <Copy className="w-2 h-2" />
                            </button>
                          </div>
                          <div className="text-gray-300 font-mono leading-relaxed">
                            {formatLogContent(message.content, message.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};