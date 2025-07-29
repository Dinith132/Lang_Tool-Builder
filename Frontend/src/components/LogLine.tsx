import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Zap, Wrench, Terminal, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types/message';

interface LogLineProps {
  message: ChatMessage;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export const LogLine: React.FC<LogLineProps> = ({ 
  message, 
  isCollapsible = false,
  defaultExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getLogConfig = (type: ChatMessage['type']) => {
    switch (type) {
      case 'ai':
        return { 
          tag: 'THOUGHT', 
          icon: <Zap className="w-3 h-3" />,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-900/20',
          borderColor: 'border-cyan-500/30'
        };
      case 'tool_result':
        return { 
          tag: 'TOOL', 
          icon: <Wrench className="w-3 h-3" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-500/30'
        };
      case 'other':
        return { 
          tag: 'SYSTEM', 
          icon: <Terminal className="w-3 h-3" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-800/20',
          borderColor: 'border-gray-600/30'
        };
      case 'error':
        return { 
          tag: 'ERROR', 
          icon: <AlertCircle className="w-3 h-3" />,
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-500/30'
        };
      default:
        return { 
          tag: 'LOG', 
          icon: <Terminal className="w-3 h-3" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-800/20',
          borderColor: 'border-gray-600/30'
        };
    }
  };

  const { tag, icon, color, bgColor, borderColor } = getLogConfig(message.type);

  const formatContent = (content: string) => {
    // Handle JSON blocks in AI messages
    if (message.type === 'ai' && content.includes('```json')) {
      const parts = content.split(/(```json[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```json')) {
          const code = part.replace(/```json\n?/, '').replace(/```$/, '');
          return (
            <div key={index} className="my-2">
              <div className="bg-gray-800 border border-gray-600 rounded text-xs overflow-hidden">
                <div className="bg-gray-700 px-2 py-1 text-gray-300 font-mono border-b border-gray-600">
                  Tool Call
                </div>
                <pre className="p-2 text-gray-200 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          );
        }
        return <span key={index}>{part}</span>;
      });
    }
    return content;
  };

  const shouldTruncate = message.content.length > 100 && !isExpanded;
  const displayContent = shouldTruncate 
    ? message.content.substring(0, 100) + '...' 
    : message.content;

  return (
    <div className={`group border-l-2 ${borderColor} ${bgColor} mb-1`}>
      <div className="flex items-start gap-2 p-2">
        {/* Expand/collapse button for long content */}
        {(isCollapsible || message.content.length > 100) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}

        {/* Icon and tag */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className={`${color}`}>
            {icon}
          </div>
          <span className={`text-xs font-mono font-bold ${color} px-1.5 py-0.5 bg-gray-800 rounded`}>
            {tag}
          </span>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500 font-mono flex-shrink-0">
          {message.timestamp.toLocaleTimeString()}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 font-mono leading-relaxed">
            {formatContent(displayContent)}
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200 ${
            copied 
              ? 'bg-green-700 text-green-200' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};