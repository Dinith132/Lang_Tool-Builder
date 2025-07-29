import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWebSocketAgent } from '../hooks/useWebSocketAgent';
import { ChatMessage } from './ChatMessage';
import { LogLine } from './LogLine';
import { FinalResult } from './FinalResult';
import { StatusBar } from './StatusBar';
import { TerminalPrompt } from './TerminalPrompt';
import { LogsPanel } from './LogsPanel';

export const ChatInterface: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [showReasoningLogs, setShowReasoningLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    finalResult,
    isLoading,
    connectionStatus,
    isConnected,
    sendQuery,
    clearMessages,
  } = useWebSocketAgent();

  // Auto-scroll to bottom when new messages arrive (only for main chat)
  useEffect(() => {
    if (!showLogs && !showReasoningLogs) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, finalResult, showLogs, showReasoningLogs]);

  const handleSendQuery = useCallback((query: string) => {
    sendQuery(query);
    setQueryHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)];
      return newHistory.slice(0, 50); // Keep last 50 queries
    });
  }, [sendQuery]);

  const handleExportSession = useCallback(() => {
    const sessionData = {
      timestamp: new Date().toISOString(),
      messages: messages,
      finalResult: finalResult,
      messageCount: messages.length,
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages, finalResult]);

  const handleClearSession = useCallback(() => {
    clearMessages();
    setQueryHistory([]);
  }, [clearMessages]);

  // Filter messages for different display contexts
  const userMessages = messages.filter(msg => msg.type === 'user');
  const logMessages = messages.filter(msg => msg.type !== 'user');
  return (
    <div className={`flex flex-col h-screen text-gray-100 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Status Bar */}
      <StatusBar
        isConnected={isConnected}
        connectionStatus={connectionStatus}
        messageCount={messages.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onExportSession={handleExportSession}
        onClearSession={handleClearSession}
        onToggleSettings={() => setShowSettings(!showSettings)}
        showLogs={showLogs}
        onToggleLogs={() => setShowLogs(!showLogs)}
      />

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 p-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200">Connection</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {connectionStatus}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                wss://ghdwgjgh-8000.asse.devtunnels.ms/ws/query
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200">Session</span>
                <span className="text-xs text-gray-400">
                  {messages.length} messages
                </span>
              </div>
              <div className="text-xs text-gray-400">
                History: {queryHistory.length} queries
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-auto p-6">
            {userMessages.length === 0 && !finalResult ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-cyan-600 rounded-2xl 
                                flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-white font-bold text-2xl font-mono">LG</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-200 mb-3 font-mono">
                  LangGraph Reasoning Agent
                </h2>
                <p className="text-gray-400 max-w-lg mb-8 leading-relaxed">
                  A powerful AI agent that can perform calculations, search for information, 
                  and reason through complex multi-step problems. Watch the reasoning process 
                  unfold in real-time.
                </p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
                  <p className="text-sm text-gray-300 mb-4 font-mono">Try these examples:</p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">$</span>
                      <span className="font-mono">"What is 1000 + 2000 and who is the president of France?"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">$</span>
                      <span className="font-mono">"Calculate 25 * 4 then search for information about AI"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">$</span>
                      <span className="font-mono">"Find the square root of 144 and tell me about quantum computing"</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {/* User Messages */}
                {userMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    showInLogs={false}
                  />
                ))}

                {/* Reasoning Logs (Collapsible) */}
                {logMessages.length > 0 && (
                  <div className="my-6">
                    <button
                      onClick={() => setShowReasoningLogs(!showReasoningLogs)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 
                                 transition-colors mb-3 font-mono"
                    >
                      <span className={`transform transition-transform ${
                        showReasoningLogs ? 'rotate-90' : ''
                      }`}>▶</span>
                      <span>Agent Reasoning ({logMessages.length} steps)</span>
                    </button>
                    
                    {showReasoningLogs && (
                      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 space-y-1">
                        {logMessages.map((message) => (
                          <LogLine
                            key={message.id}
                            message={message}
                            isCollapsible={message.content.length > 100}
                            defaultExpanded={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Final Result */}
                {finalResult && (
                  <FinalResult 
                    message={finalResult} 
                    showTypewriter={!isLoading}
                  />
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center gap-3 text-gray-400 my-6">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">Agent is reasoning</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
            
          </div>

          {/* Terminal Prompt */}
          <TerminalPrompt
            onSubmit={handleSendQuery}
            isLoading={isLoading}
            isConnected={isConnected}
            history={queryHistory}
          />
        </div>

        {/* Logs Panel */}
        <LogsPanel
          messages={messages}
          isVisible={showLogs}
        />
      </div>
    </div>
  );
};