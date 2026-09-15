/**
 * Header Component - Navigation, Actions and Status Bar
 */

import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Settings, 
  ListTree, 
  Play, 
  Sparkles, 
  FileCode2, 
  RefreshCw,
  GitCompare,
  Upload,
  Layers
} from 'lucide-react';
import { DeobfResult } from '../types';

interface HeaderProps {
  onDeobfuscate: () => void;
  isProcessing: boolean;
  onOpenSettings: () => void;
  onOpenSteps: () => void;
  onOpenSecurity: () => void;
  onOpenSamples: () => void;
  onReset: () => void;
  viewMode: 'split' | 'diff';
  onToggleViewMode: () => void;
  result: DeobfResult | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onDeobfuscate,
  isProcessing,
  onOpenSettings,
  onOpenSteps,
  onOpenSecurity,
  onOpenSamples,
  onReset,
  viewMode,
  onToggleViewMode,
  result,
  onFileUpload
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const threatScore = result?.securityReport.score || 'safe';
  const hasThreats = result && result.securityReport.threats.length > 0;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/5">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                Luau Deobf <span className="text-emerald-400">Pro</span>
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Web Suite
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              High-performance Luau & Lua reverse engineering & security analyzer
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Preset Samples */}
          <button
            type="button"
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-700/80 rounded-md transition-colors"
            title="Load sample obfuscated scripts"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Presets</span>
          </button>

          {/* Upload File */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept=".lua,.luau,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-700/80 rounded-md transition-colors"
            title="Upload .luau / .lua script"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Upload</span>
          </button>

          {/* Diff View Toggle */}
          <button
            type="button"
            onClick={onToggleViewMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              viewMode === 'diff'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Toggle side-by-side diff comparison"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Diff Mode</span>
          </button>

          {/* Steps Inspector */}
          {result && result.steps.length > 0 && (
            <button
              type="button"
              onClick={onOpenSteps}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-700/80 rounded-md transition-colors"
              title="Inspect intermediate pipeline passes"
            >
              <ListTree className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pipeline Steps ({result.steps.length})</span>
            </button>
          )}

          {/* Security Status Badge */}
          {result && (
            <button
              type="button"
              onClick={onOpenSecurity}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                threatScore === 'dangerous'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : threatScore === 'suspicious'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title="View security and threat report"
            >
              {hasThreats ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="capitalize">{threatScore.replace('_', ' ')}</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-700/80 rounded-md transition-colors"
            title="Configure deobfuscation passes"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Options</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-md transition-colors"
            title="Reset code"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onDeobfuscate}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm shadow-emerald-500/20 transition-all font-mono"
          >
            {isProcessing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isProcessing ? 'Deobfuscating...' : 'Deobfuscate'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
