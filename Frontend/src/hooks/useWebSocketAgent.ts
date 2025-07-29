import { useState, useRef, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { StreamMessage, ChatMessage } from '../types/message';

const WS_URL = 'ws://localhost:8000/ws/query';
// const WS_URL = 'wss://ghdwgjgh-8000.asse.devtunnels.ms/ws/query';


export const useWebSocketAgent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [finalResult, setFinalResult] = useState<ChatMessage | null>(null);
  const lastAiMessageRef = useRef<ChatMessage | null>(null);

  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => {
      console.log('WebSocket connection established');
    },
    onClose: () => {
      console.log('WebSocket connection closed');
      setIsLoading(false);
    },
    onError: (event) => {
      console.error('WebSocket error:', event);
      setIsLoading(false);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'error',
        content: 'Connection error occurred. Please check your network and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
    shouldReconnect: () => true,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  // Process incoming WebSocket messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data: StreamMessage = JSON.parse(lastMessage.data);
        processStreamMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  const processStreamMessage = useCallback((data: StreamMessage) => {
    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    if (data.type === 'end') {
      setIsLoading(false);
      // Set the last AI message as the final result
      if (lastAiMessageRef.current) {
        setFinalResult(lastAiMessageRef.current);
      }
      return;
    }

    if (data.type === 'error') {
      setMessages(prev => [...prev, {
        id: messageId,
        type: 'error',
        content: data.detail || 'An error occurred',
        timestamp: new Date(),
      }]);
      setIsLoading(false);
      lastAiMessageRef.current = null;
      return;
    }

    // Create new message for each stream event
    const newMessage: ChatMessage = {
      id: messageId,
      type: data.type as ChatMessage['type'],
      content: data.content || '',
      timestamp: new Date(),
      isStreaming: false,
    };

    // Track the last AI message for final result display
    if (data.type === 'ai') {
      lastAiMessageRef.current = newMessage;
    }

    setMessages(prev => [...prev, newMessage]);
  }, []);

  const sendQuery = useCallback((query: string) => {
    if (readyState !== ReadyState.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    // Clear previous final result
    setFinalResult(null);
    lastAiMessageRef.current = null;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Send query to WebSocket
    sendMessage(query);
  }, [readyState, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setFinalResult(null);
    lastAiMessageRef.current = null;
    setIsLoading(false);
  }, []);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Disconnected',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return {
    messages,
    finalResult,
    isLoading,
    connectionStatus,
    isConnected: readyState === ReadyState.OPEN,
    sendQuery,
    clearMessages,
  };
};