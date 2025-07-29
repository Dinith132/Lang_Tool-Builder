import React, { useState } from 'react';
import { Copy, Zap, Wrench, Terminal, AlertCircle, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types/message';
import { MessageTypeTag } from './MessageTypeTag';

interface ChatMessageProps {
  message: ChatMessageType;
  showInLogs?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, showInLogs = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMessageIcon = (type: ChatMessageType['type']) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'ai':
        return <Zap className="w-4 h-4" />;
      case 'tool_result':
        return <Wrench className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Terminal className="w-4 h-4" />;
    }
  };

  const isUserMessage = message.type === 'user';


  return (
    <div className={`group relative mb-6 ${isUserMessage ? 'ml-8' : 'mr-8'}`}>
      <div className={`flex items-start gap-3 ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar/Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUserMessage 
            ? 'bg-green-600 text-green-100' 
            : message.type === 'error'
            ? 'bg-red-600 text-red-100'
            : 'bg-cyan-600 text-cyan-100'
        }`}>
          {getMessageIcon(message.type)}
        </div>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUserMessage ? 'text-right' : ''}`}>
          {/* User message with terminal prompt style */}
          {isUserMessage ? (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 font-mono">
                <span className="text-green-400">user@agent:~$</span>
                <span>{message.timestamp.toLocaleTimeString()}</span>
              </div>
              <div className="text-gray-100 font-mono text-base">
                {message.content}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageTypeTag type={message.type} />
                <span className="text-xs text-gray-500 font-mono">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.isStreaming && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                  </div>
                )}
              </div>
              <div className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          )}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                       bg-gray-800 hover:bg-gray-700 p-1.5 rounded transition-all duration-200
                       ${copied ? 'bg-green-700 text-green-100' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Copy className="w-3 h-3" />
          </button>
      </div>
    </div>
  );
};