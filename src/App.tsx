/**
 * Luau Deobfuscator Pro - Main Application Workspace
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { DiffViewer } from './components/DiffViewer';
import { StatsBanner } from './components/StatsBanner';
import { PipelineSettingsModal } from './components/PipelineSettingsModal';
import { SecurityReportModal } from './components/SecurityReportModal';
import { StepInspectorModal } from './components/StepInspectorModal';
import { SamplesModal } from './components/SamplesModal';
import { SandboxTool } from './components/SandboxTool';
import { DeobfOptions, DeobfResult, ScriptSample } from './types';
import { runDeobfuscation, DEFAULT_DEOBF_OPTIONS } from './lib/deobf/engine';
import { SAMPLES } from './lib/deobf/samples';
import { Terminal, Shield, ArrowDown, Sparkles } from 'lucide-react';

export default function App() {
  const [inputCode, setInputCode] = useState<string>(SAMPLES[0].code);
  const [result, setResult] = useState<DeobfResult | null>(null);
  const [options, setOptions] = useState<DeobfOptions>(DEFAULT_DEOBF_OPTIONS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'diff'>('split');
  const [activeSampleId, setActiveSampleId] = useState<string>(SAMPLES[0].id);

  // Modal Dialog States
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStepsOpen, setIsStepsOpen] = useState<boolean>(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState<boolean>(false);
  const [showSandbox, setShowSandbox] = useState<boolean>(false);

  // Run initial deobfuscation on load
  const executeDeobfuscation = useCallback((codeToProcess?: string, optsToUse?: DeobfOptions) => {
    setIsProcessing(true);
    const code = codeToProcess ?? inputCode;
    const opts = optsToUse ?? options;

    setTimeout(() => {
      try {
        const res = runDeobfuscation(code, opts);
        setResult(res);
      } catch (err) {
        console.error('Deobfuscation error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  }, [inputCode, options]);

  useEffect(() => {
    executeDeobfuscation(SAMPLES[0].code, DEFAULT_DEOBF_OPTIONS);
  }, []);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeDeobfuscation();
      }
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsStepsOpen(false);
        setIsSecurityOpen(false);
        setIsSamplesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeDeobfuscation]);

  const handleSelectSample = (sample: ScriptSample) => {
    setInputCode(sample.code);
    setActiveSampleId(sample.id);
    executeDeobfuscation(sample.code);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputCode(content);
        setActiveSampleId('');
        executeDeobfuscation(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    setInputCode('');
    setResult(null);
    setActiveSampleId('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        onDeobfuscate={() => executeDeobfuscation()}
        isProcessing={isProcessing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSteps={() => setIsStepsOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenSamples={() => setIsSamplesOpen(true)}
        onReset={handleReset}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'split' ? 'diff' : 'split'))}
        result={result}
        onFileUpload={handleFileUpload}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Statistics & Optimization Banner */}
        {result && (
          <StatsBanner
            stats={result.stats}
            detectedObfuscators={result.detectedObfuscators}
            onOpenSecurity={() => setIsSecurityOpen(true)}
            threatLevel={result.securityReport.score}
          />
        )}

        {/* Workspace Views */}
        <div className="flex-1 flex flex-col min-h-[520px]">
          {viewMode === 'diff' && result ? (
            <DiffViewer
              originalCode={result.originalCode}
              deobfuscatedCode={result.deobfuscatedCode}
              onClose={() => setViewMode('split')}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
              {/* Left Column: Obfuscated Input */}
              <CodeEditor
                title="Input Script (Obfuscated)"
                badge="Raw Luau / Lua"
                value={inputCode}
                onChange={setInputCode}
                placeholder="Paste your obfuscated Luau script here or drop a file..."
                stats={{
                  lines: inputCode.split('\n').length,
                  size: new Blob([inputCode]).size
                }}
              />

              {/* Right Column: Deobfuscated Output */}
              <CodeEditor
                title="Deobfuscated Script"
                badge={result ? `${result.detectedObfuscators[0] || 'Cleaned'}` : 'Pending'}
                value={result ? result.deobfuscatedCode : '-- Click "Deobfuscate" to begin reverse-engineering pipeline'}
                readOnly
                stats={
                  result
                    ? {
                        lines: result.stats.outputLines,
                        size: result.stats.outputSize
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {/* Collapsible Sandbox Assistant */}
        <div className="border border-zinc-800/80 rounded-lg overflow-hidden bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setShowSandbox(!showSandbox)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900/40 hover:bg-zinc-900/80 text-xs font-medium text-zinc-300 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interactive Byte, XOR & Hex Sandbox Playground</span>
            </div>
            <span className="text-[11px] text-zinc-500">{showSandbox ? 'Hide' : 'Expand'}</span>
          </button>
          {showSandbox && (
            <div className="p-3 border-t border-zinc-800/80">
              <SandboxTool />
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-zinc-900 py-3 px-4 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Luau Deobfuscator Pro • Full Client & Server-side Lua Analysis</span>
          <div className="flex items-center gap-3 text-zinc-500">
            <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Ctrl + Enter</kbd> to run</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsSamplesOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Presets
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsSecurityOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Security Scanner
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PipelineSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onChangeOptions={(newOpts) => {
          setOptions(newOpts);
          executeDeobfuscation(undefined, newOpts);
        }}
      />

      <SecurityReportModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        report={result ? result.securityReport : null}
        detectedObfuscators={result ? result.detectedObfuscators : []}
      />

      <StepInspectorModal
        isOpen={isStepsOpen}
        onClose={() => setIsStepsOpen(false)}
        steps={result ? result.steps : []}
      />

      <SamplesModal
        isOpen={isSamplesOpen}
        onClose={() => setIsSamplesOpen(false)}
        onSelectSample={handleSelectSample}
        activeSampleId={activeSampleId}
      />
    </div>
  );
}
