import React, { useState } from 'react';
import { Copy, Download, Check, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types/message';
import { TypewriterText } from './TypewriterText';

interface FinalResultProps {
  message: ChatMessage;
  showTypewriter?: boolean;
}

export const FinalResult: React.FC<FinalResultProps> = ({
  message,
  showTypewriter = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [typewriterComplete, setTypewriterComplete] = useState(!showTypewriter);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const markdown = `# Agent Response\n\n${message.content}\n\n---\n*Generated at ${message.timestamp.toLocaleString()}*`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-response-${message.timestamp.getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatContent = (content: string) => {
    if (content.includes('- ') || content.includes('* ') || content.includes('\n1. ')) {
      return content.split('\n').map((line, index) => {
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={index} className="flex items-start gap-2 text-sm my-1">
              <span className="text-cyan-500">•</span>
              <span>{line.trim().substring(2)}</span>
            </div>
          );
        } else if (/^\d+\.\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+)\.\s(.*)$/);
          if (match) {
            return (
              <div key={index} className="flex items-start gap-2 text-sm my-1">
                <span className="text-cyan-500">{match[1]}.</span>
                <span>{match[2]}</span>
              </div>
            );
          }
        }
        return line && <div key={index} className="text-sm my-1">{line}</div>;
      });
    }
    return <div className="text-sm whitespace-pre-wrap">{content}</div>;
  };

  return (
    <div className="my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-cyan-600 rounded flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-cyan-600">Final Result</h3>
            <p className="text-xs text-gray-400">{message.timestamp.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-2 py-1 rounded text-sm transition ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
            title="Copy"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded"
            title="Export"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main result */}
      <div className="bg-gray-900 border border-cyan-700 rounded-lg p-5 text-sm text-gray-100">
        {showTypewriter && !typewriterComplete ? (
          <TypewriterText
            text={message.content}
            speed={15}
            onComplete={() => setTypewriterComplete(true)}
            className="block"
          />
        ) : (
          formatContent(message.content)
        )}
      </div>
    </div>
  );
};
