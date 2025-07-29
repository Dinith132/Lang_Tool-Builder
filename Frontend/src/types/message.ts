export interface StreamMessage {
  type: 'ai' | 'tool_result' | 'other' | 'end' | 'error';
  content?: string;
  detail?: string;
  trace?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'tool_result' | 'other' | 'error';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface AgentSession {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
}