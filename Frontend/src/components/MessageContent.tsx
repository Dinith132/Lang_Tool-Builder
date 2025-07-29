import React from 'react';
import { ChatMessage } from '../types/message';

interface MessageContentProps {
  message: ChatMessage;
}

export const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const formatContent = (content: string, type: ChatMessage['type']) => {
    // For AI messages, check if it's a final summary (contains bullet points or clear results)
    if (type === 'ai' && (
      content.includes('Here are the results:') || 
      content.includes('I have completed') ||
      content.includes('Here is the summary:') ||
      content.includes('Final answer:')
    )) {
      return { content, isFinalAnswer: true };
    }

    // Format tool results
    if (type === 'tool_result') {
      // Check if it's an error message
      if (content.includes('validation error') || content.includes('Error:')) {
        return { content, isError: true };
      }
    }

    return { content, isFinalAnswer: false, isError: false };
  };

  const { content, isFinalAnswer, isError } = formatContent(message.content, message.type);

  // Final answer gets special treatment
  if (isFinalAnswer) {
    return (
      <div className="bg-gradient-to-r from-green-900/40 to-cyan-900/40 border border-green-500/40 rounded-xl p-6 mt-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-semibold text-lg">Final Answer</span>
          <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
        </div>
        <div className="text-gray-100 whitespace-pre-wrap leading-relaxed text-lg font-medium">
          {content}
        </div>
      </div>
    );
  }

  const getMessageStyles = (type: ChatMessage['type']) => {
    switch (type) {
      case 'user':
        return 'text-blue-200 bg-blue-900/30 border-blue-500/30';
      case 'ai':
        return 'text-cyan-200 bg-cyan-900/20 border-cyan-500/20';
      case 'tool_result':
        return isError 
          ? 'text-red-200 bg-red-900/30 border-red-500/30'
          : 'text-yellow-200 bg-yellow-900/20 border-yellow-500/20';
      case 'other':
        return 'text-gray-300 bg-gray-800/40 border-gray-600/30';
      case 'error':
        return 'text-red-200 bg-red-900/30 border-red-500/30';
      default:
        return 'text-gray-300 bg-gray-800/40 border-gray-600/30';
    }
  };

  // Detect and format JSON code blocks in AI messages
  const formatAIContent = (content: string) => {
    if (message.type === 'ai' && content.includes('```json')) {
      const parts = content.split(/(```json[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```json')) {
          const code = part.replace(/```json\n?/, '').replace(/```$/, '');
          return (
            <div key={index} className="my-3">
              <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-3 py-1 text-xs text-gray-300 font-mono border-b border-gray-600">
                  Tool Call
                </div>
                <pre className="p-3 text-sm text-gray-200 overflow-x-auto">
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

  return (
    <div className={`rounded-lg p-4 border ${getMessageStyles(message.type)} transition-all duration-300`}>
      <div className="whitespace-pre-wrap leading-relaxed">
        {message.type === 'ai' ? (
          <div className="text-sm">
            {formatAIContent(content)}
          </div>
        ) : (
          <div className={`${message.type === 'user' ? 'font-medium' : 'font-mono text-sm'}`}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
};