/**
 * Step Inspector Modal - Browse the intermediate transformations of each deobfuscation pass
 */

import React, { useState } from 'react';
import { X, ListTree, ArrowRight, Clock, Zap, Check, Copy } from 'lucide-react';
import { PipelineStep } from '../types';

interface StepInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: PipelineStep[];
}

export const StepInspectorModal: React.FC<StepInspectorModalProps> = ({
  isOpen,
  onClose,
  steps
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[selectedIdx] || steps[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentStep.codeAfter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl h-[85vh] rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ListTree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Pipeline Pass Inspector</h2>
              <p className="text-xs text-zinc-400">
                Inspect code transformations at each stage of the deobfuscation process
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800/60">
          {steps.map((step, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedIdx === idx
                  ? 'bg-zinc-800 text-emerald-300 border-zinc-700 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center font-mono">
                {idx + 1}
              </span>
              <span>{step.name}</span>
              <span className="text-[10px] font-mono text-zinc-500">({step.changesCount})</span>
            </button>
          ))}
        </div>

        {/* Step Metadata Bar */}
        <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60 text-xs">
          <div>
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <span>{currentStep.name}</span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> {currentStep.changesCount} modifications
              </span>
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {currentStep.durationMs}ms
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] mt-0.5">{currentStep.description}</p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy State'}</span>
          </button>
        </div>

        {/* Code View of Current Step */}
        <div className="flex-1 overflow-hidden border border-zinc-800 rounded-lg bg-zinc-950 font-mono text-xs flex flex-col">
          <div className="px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Result after {currentStep.name}</span>
            <span>{currentStep.codeAfter.split('\n').length} lines</span>
          </div>
          <div className="flex-1 overflow-auto p-3 text-zinc-300 whitespace-pre">
            {currentStep.codeAfter}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
          <div className="text-zinc-400">
            Step {selectedIdx + 1} of {steps.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIdx === 0}
              onClick={() => setSelectedIdx((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 rounded border border-zinc-700/60 transition-colors"
            >
              Previous Pass
            </button>
            <button
              type="button"
              disabled={selectedIdx === steps.length - 1}
              onClick={() => setSelectedIdx((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 rounded border border-zinc-700/60 transition-colors"
            >
              Next Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
