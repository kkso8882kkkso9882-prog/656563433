/**
 * Diff Viewer Component - Side-by-side or Unified line comparison
 */

import React, { useMemo } from 'react';
import { GitCompare, Plus, Minus, Equal } from 'lucide-react';

interface DiffViewerProps {
  originalCode: string;
  deobfuscatedCode: string;
  onClose: () => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'same';
  text: string;
  lineNumOriginal?: number;
  lineNumDeobf?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  deobfuscatedCode,
  onClose
}) => {
  const diffLines = useMemo(() => {
    const orig = originalCode.split('\n');
    const deobf = deobfuscatedCode.split('\n');

    const lines: DiffLine[] = [];
    const max = Math.max(orig.length, deobf.length);

    // Simple line alignment diff
    let origIdx = 0;
    let deobfIdx = 0;

    while (origIdx < orig.length || deobfIdx < deobf.length) {
      const lineOrig = orig[origIdx];
      const lineDeobf = deobf[deobfIdx];

      if (origIdx >= orig.length) {
        lines.push({
          type: 'added',
          text: lineDeobf,
          lineNumDeobf: deobfIdx + 1
        });
        deobfIdx++;
      } else if (deobfIdx >= deobf.length) {
        lines.push({
          type: 'removed',
          text: lineOrig,
          lineNumOriginal: origIdx + 1
        });
        origIdx++;
      } else if (lineOrig === lineDeobf) {
        lines.push({
          type: 'same',
          text: lineOrig,
          lineNumOriginal: origIdx + 1,
          lineNumDeobf: deobfIdx + 1
        });
        origIdx++;
        deobfIdx++;
      } else {
        // Line modified: show removal then addition
        lines.push({
          type: 'removed',
          text: lineOrig,
          lineNumOriginal: origIdx + 1
        });
        lines.push({
          type: 'added',
          text: lineDeobf,
          lineNumDeobf: deobfIdx + 1
        });
        origIdx++;
        deobfIdx++;
      }
    }

    return lines;
  }, [originalCode, deobfuscatedCode]);

  const addedCount = diffLines.filter((l) => l.type === 'added').length;
  const removedCount = diffLines.filter((l) => l.type === 'removed').length;

  return (
    <div className="flex flex-col h-full rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <GitCompare className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">Deobfuscation Diff Comparison</span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center text-emerald-400 gap-0.5">
              <Plus className="w-3 h-3" /> {addedCount}
            </span>
            <span className="flex items-center text-rose-400 gap-0.5">
              <Minus className="w-3 h-3" /> {removedCount}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          Exit Diff View
        </button>
      </div>

      {/* Diff Table */}
      <div className="flex-1 overflow-auto p-2 text-xs leading-relaxed">
        {diffLines.map((line, idx) => {
          let bgClass = 'hover:bg-zinc-900/50 text-zinc-400';
          let indicator = ' ';
          let indColor = 'text-zinc-600';

          if (line.type === 'added') {
            bgClass = 'bg-emerald-950/30 text-emerald-200 border-l-2 border-emerald-500';
            indicator = '+';
            indColor = 'text-emerald-400 font-bold';
          } else if (line.type === 'removed') {
            bgClass = 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500 line-through opacity-75';
            indicator = '-';
            indColor = 'text-rose-400 font-bold';
          }

          return (
            <div key={idx} className={`flex items-start gap-2 py-0.5 px-2 rounded-sm ${bgClass}`}>
              <span className={`w-3 text-center shrink-0 ${indColor}`}>{indicator}</span>
              <span className="w-8 text-right text-zinc-600 shrink-0 select-none">
                {line.lineNumOriginal || ''}
              </span>
              <span className="w-8 text-right text-zinc-600 shrink-0 select-none">
                {line.lineNumDeobf || ''}
              </span>
              <pre className="flex-1 overflow-x-auto whitespace-pre font-mono">{line.text || ' '}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};
