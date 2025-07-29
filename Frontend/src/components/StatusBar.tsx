import React from 'react';
import { Wifi, WifiOff, Moon, Sun, Download, Trash2, Settings, Activity } from 'lucide-react';

interface StatusBarProps {
  isConnected: boolean;
  connectionStatus: string;
  messageCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportSession: () => void;
  onClearSession: () => void;
  onToggleSettings: () => void;
  showLogs: boolean;
  onToggleLogs: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isConnected,
  connectionStatus,
  messageCount,
  isDarkMode,
  onToggleDarkMode,
  onExportSession,
  onClearSession,
  onToggleSettings,
  showLogs,
  onToggleLogs
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm">
      {/* Left side - Connection status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-mono">agent@localhost</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <><Wifi className="w-3 h-3 text-green-400" /> <span className="text-green-400">{connectionStatus}</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-red-400" /> <span className="text-red-400">{connectionStatus}</span></>
          )}
        </div>

        <div className="text-gray-400 font-mono">
          Messages: {messageCount}
        </div>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLogs}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
            showLogs 
              ? 'bg-cyan-900 text-cyan-300 border border-cyan-600' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <Activity className="w-3 h-3" />
          Logs
        </button>

        <button
          onClick={onToggleDarkMode}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        </button>

        <button
          onClick={onExportSession}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
          title="Export session"
        >
          <Download className="w-3 h-3" />
        </button>

        <button
          onClick={onClearSession}
          className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
          title="Clear session"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        <button
          onClick={onToggleSettings}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-3 h-3" />
        </button>

        <div className="text-gray-500 font-mono text-xs">
          {isDarkMode ? '🌙 dark' : '☀️ light'}
        </div>
      </div>
    </div>
  );
};