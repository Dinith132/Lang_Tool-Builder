import React from 'react';
import { ChatMessage } from '../types/message';

interface MessageTypeTagProps {
  type: ChatMessage['type'];
}

export const MessageTypeTag: React.FC<MessageTypeTagProps> = ({ type }) => {
  const getTagConfig = (type: ChatMessage['type']) => {
    switch (type) {
      case 'user':
        return { label: 'USER', className: 'bg-blue-600 text-blue-100' };
      case 'ai':
        return { label: 'AI', className: 'bg-cyan-600 text-cyan-100' };
      case 'tool_result':
        return { label: 'TOOL', className: 'bg-yellow-600 text-yellow-100' };
      case 'other':
        return { label: 'SYSTEM', className: 'bg-gray-600 text-gray-100' };
      case 'error':
        return { label: 'ERROR', className: 'bg-red-600 text-red-100' };
      default:
        return { label: 'UNKNOWN', className: 'bg-gray-600 text-gray-100' };
    }
  };

  const { label, className } = getTagConfig(type);

  return (
    <span className={`inline-block px-2 py-1 text-xs font-mono font-bold rounded ${className}`}>
      {label}
    </span>
  );
};