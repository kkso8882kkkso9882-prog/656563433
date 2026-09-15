/**
 * Stats Banner Component - Displays optimization, size, and deobfuscation metrics
 */

import React from 'react';
import { Sparkles, ArrowRight, Zap, Code2, Shield, Clock } from 'lucide-react';
import { DeobfStats } from '../types';

interface StatsBannerProps {
  stats: DeobfStats | null;
  detectedObfuscators: string[];
  onOpenSecurity: () => void;
  threatLevel: string;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  stats,
  detectedObfuscators,
  onOpenSecurity,
  threatLevel
}) => {
  if (!stats) return null;

  const sizeDiff = stats.originalSize - stats.outputSize;
  const pctChange = stats.originalSize > 0 ? ((sizeDiff / stats.originalSize) * 100).toFixed(1) : '0';

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-1 text-xs font-mono">
      {/* Metric 1: Size Delta */}
      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Payload Size</div>
        <div className="flex items-center gap-1.5 mt-1 font-semibold text-zinc-200">
          <span>{formatBytes(stats.originalSize)}</span>
          <ArrowRight className="w-3 h-3 text-zinc-600" />
          <span className="text-emerald-400">{formatBytes(stats.outputSize)}</span>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">
          {parseFloat(pctChange) >= 0 ? `-${pctChange}% reduction` : `+${Math.abs(parseFloat(pctChange))}% expand`}
        </div>
      </div>

      {/* Metric 2: Lines Delta */}
      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Lines of Code</div>
        <div className="flex items-center gap-1.5 mt-1 font-semibold text-zinc-200">
          <span>{stats.originalLines}</span>
          <ArrowRight className="w-3 h-3 text-zinc-600" />
          <span className="text-emerald-400">{stats.outputLines}</span>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Structured & formatted</div>
      </div>

      {/* Metric 3: Decoded Strings */}
      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Strings Decoded</div>
        <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{stats.stringsDecoded}</span>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Escapes & char codes</div>
      </div>

      {/* Metric 4: Constants Folded */}
      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Constants Folded</div>
        <div className="text-sm font-bold text-cyan-400 mt-1 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          <span>{stats.constantsFolded}</span>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Math & bitwise logic</div>
      </div>

      {/* Metric 5: Dead Branches */}
      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Branches Pruned</div>
        <div className="text-sm font-bold text-purple-400 mt-1 flex items-center gap-1">
          <Code2 className="w-3.5 h-3.5" />
          <span>{stats.deadBranchesRemoved}</span>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Opaque predicates cut</div>
      </div>

      {/* Metric 6: Execution Speed */}
      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Pipeline Time</div>
        <div className="text-sm font-bold text-amber-400 mt-1 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{stats.totalTimeMs} ms</span>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
          {detectedObfuscators[0] || 'Clean'}
        </div>
      </div>
    </div>
  );
};
