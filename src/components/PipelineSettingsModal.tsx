/**
 * Pipeline Settings Modal - Configure passes and deobfuscation behavior
 */

import React from 'react';
import { X, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';
import { DeobfOptions } from '../types';
import { DEFAULT_DEOBF_OPTIONS } from '../lib/deobf/engine';

interface PipelineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: DeobfOptions;
  onChangeOptions: (opts: DeobfOptions) => void;
}

export const PipelineSettingsModal: React.FC<PipelineSettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChangeOptions
}) => {
  if (!isOpen) return null;

  const update = <K extends keyof DeobfOptions>(key: K, val: DeobfOptions[K]) => {
    onChangeOptions({ ...options, [key]: val });
  };

  const handleReset = () => {
    onChangeOptions({ ...DEFAULT_DEOBF_OPTIONS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Deobfuscation Passes</h2>
              <p className="text-xs text-zinc-400">Customize the Luau reverse-engineering pipeline</p>
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

        {/* Options List */}
        <div className="space-y-4 text-xs">
          {/* Section 1: String & Table Decoding */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              1. String & Data Table Decoding
            </h3>
            <div className="space-y-1.5 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Decode String Escapes</div>
                  <div className="text-[11px] text-zinc-500">Converts \xHH hex, decimal, and unicode escapes</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.decodeHexEscapes}
                  onChange={(e) => update('decodeHexEscapes', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Decode Byte Arrays (string.char)</div>
                  <div className="text-[11px] text-zinc-500">Evaluates string.char(104, 101, ...) calls into strings</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.decodeCharCodes}
                  onChange={(e) => update('decodeCharCodes', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Resolve Table String Pools</div>
                  <div className="text-[11px] text-zinc-500">Inlines lookup tables and replaces array indexing</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.resolveTableLookups}
                  onChange={(e) => update('resolveTableLookups', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Decode XOR Encryption Patterns</div>
                  <div className="text-[11px] text-zinc-500">Decrypts bit32.bxor byte decryptor loops</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.decodeXorPatterns}
                  onChange={(e) => update('decodeXorPatterns', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Code Structure & Logic */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              2. Expressions & Control Flow
            </h3>
            <div className="space-y-1.5 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Constant Folding & Math</div>
                  <div className="text-[11px] text-zinc-500">Simplifies arithmetic (10*2+5), bitwise math, boolean logic</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.constantFolding}
                  onChange={(e) => update('constantFolding', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Dead Code Elimination</div>
                  <div className="text-[11px] text-zinc-500">Removes unreachable if-false blocks and unwraps if-true</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.deadCodeElimination}
                  onChange={(e) => update('deadCodeElimination', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Inline Proxy Functions</div>
                  <div className="text-[11px] text-zinc-500">Inlines wrapper functions that only forward binary ops</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.inlineProxies}
                  onChange={(e) => update('inlineProxies', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Renaming & Formatting */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              3. Variable Renaming & Formatting
            </h3>
            <div className="space-y-2 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Normalize Obfuscated Identifiers</div>
                  <div className="text-[11px] text-zinc-500">Cleans barcode (Il1) and hex (_0x...) variable names</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.normalizeIdentifiers}
                  onChange={(e) => update('normalizeIdentifiers', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>

              {options.normalizeIdentifiers && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-zinc-400">Renaming Style:</span>
                  <select
                    value={options.identifierStyle}
                    onChange={(e) => update('identifierStyle', e.target.value as any)}
                    className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
                  >
                    <option value="semantic">Semantic (fn_1, tbl_1, var_1)</option>
                    <option value="numbered">Simple (v1, v2, v3)</option>
                    <option value="keep">Keep Original</option>
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                <span className="text-zinc-400">Indentation:</span>
                <select
                  value={options.indentStyle}
                  onChange={(e) => update('indentStyle', e.target.value as any)}
                  className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value="2spaces">2 Spaces</option>
                  <option value="4spaces">4 Spaces</option>
                  <option value="tabs">Tabs</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Simplify Luau Type Annotations</div>
                  <div className="text-[11px] text-zinc-500">Strips redundant :: any and empty type tags</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.simplifyLuauTypes}
                  onChange={(e) => update('simplifyLuauTypes', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="font-medium text-zinc-200">Roblox Security & Threat Scanner</div>
                  <div className="text-[11px] text-zinc-500">Flags Discord webhooks, stealers, and dynamic loaders</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.detectThreats}
                  onChange={(e) => update('detectThreats', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
