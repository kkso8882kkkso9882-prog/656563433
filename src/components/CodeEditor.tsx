/**
 * Code Editor Component with syntax highlighting, line numbers, search, and copy/download controls
 */

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Download, Search, WrapText, Maximize2, Minimize2, FileCode } from 'lucide-react';

interface CodeEditorProps {
  title: string;
  badge?: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  stats?: {
    lines: number;
    size: number;
  };
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  title,
  badge,
  value,
  onChange,
  readOnly = false,
  placeholder,
  stats
}) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lineCount = value.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Sync scrolling between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const filename = `${title.toLowerCase().includes('input') ? 'obfuscated' : 'deobfuscated'}.luau`;
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className={`flex flex-col rounded-lg border border-zinc-800 bg-zinc-950/70 overflow-hidden shadow-sm transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 bg-zinc-950' : 'h-full min-h-[460px]'
      }`}
    >
      {/* Pane Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/60 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">{title}</span>
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {stats && (
            <div className="hidden sm:flex items-center gap-2 mr-2 text-[11px] font-mono text-zinc-400">
              <span>{stats.lines} lines</span>
              <span className="text-zinc-600">•</span>
              <span>{formatBytes(stats.size)}</span>
            </div>
          )}

          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors ${
              searchOpen ? 'bg-zinc-800 text-zinc-200' : ''
            }`}
            title="Search code"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Word Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWrap(!wrap)}
            className={`p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors ${
              wrap ? 'bg-zinc-800 text-emerald-400' : ''
            }`}
            title="Toggle word wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen view'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Download as .luau file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar Subheader */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/90 text-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search string, function or variable..."
            className="bg-transparent border-none outline-none text-zinc-200 placeholder:text-zinc-500 w-full text-xs font-mono"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-zinc-400 hover:text-zinc-200"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Editor Body */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-[13px] leading-relaxed">
        {/* Line Numbers Bar */}
        <div
          ref={lineNumbersRef}
          className="select-none py-3 px-2 bg-zinc-950 text-zinc-600 text-right font-mono border-r border-zinc-800/80 overflow-hidden w-12 shrink-0 pointer-events-none"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="leading-relaxed">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onScroll={handleScroll}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className={`flex-1 p-3 bg-transparent text-zinc-200 resize-none outline-none overflow-auto font-mono selection:bg-emerald-500/20 selection:text-emerald-200 ${
            wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
          }`}
        />
      </div>
    </div>
  );
};
