/**
 * Preset Script Samples Modal
 */

import React from 'react';
import { X, Layers, Play, Check } from 'lucide-react';
import { ScriptSample } from '../types';
import { SAMPLES } from '../lib/deobf/samples';

interface SamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: ScriptSample) => void;
  activeSampleId?: string;
}

export const SamplesModal: React.FC<SamplesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  activeSampleId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Sample Obfuscated Scripts</h2>
              <p className="text-xs text-zinc-400">
                Select a benchmark script to test string decoding, control flow recovery, or malware scanning
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

        {/* Samples List */}
        <div className="grid grid-cols-1 gap-2.5">
          {SAMPLES.map((sample) => {
            const isSelected = sample.id === activeSampleId;
            return (
              <div
                key={sample.id}
                onClick={() => {
                  onSelectSample(sample);
                  onClose();
                }}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-zinc-900/80 ${
                  isSelected
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-zinc-900/40 border-zinc-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{sample.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                        {sample.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{sample.description}</p>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-zinc-800 hover:bg-emerald-400 hover:text-zinc-950 text-zinc-300 rounded transition-colors shrink-0"
                  >
                    {isSelected ? <Check className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3" />}
                    <span>{isSelected ? 'Loaded' : 'Load'}</span>
                  </button>
                </div>

                <div className="mt-2.5 bg-zinc-950/80 p-2 rounded border border-zinc-800/60 font-mono text-[11px] text-zinc-500 truncate">
                  {sample.code.split('\n').slice(0, 3).join(' ')}...
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
