/**
 * Security & Threat Intelligence Audit Modal
 */

import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Copy, Check, EyeOff } from 'lucide-react';
import { SecurityReport } from '../types';

interface SecurityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SecurityReport | null;
  detectedObfuscators: string[];
}

export const SecurityReportModal: React.FC<SecurityReportModalProps> = ({
  isOpen,
  onClose,
  report,
  detectedObfuscators
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getScoreBadge = () => {
    switch (report.score) {
      case 'dangerous':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Dangerous Script</div>
              <div className="text-[11px] text-rose-300/80">Contains malicious webhooks, stealers, or dangerous loaders</div>
            </div>
          </div>
        );
      case 'suspicious':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Suspicious Activity</div>
              <div className="text-[11px] text-amber-300/80">Performs external requests or dynamic code execution</div>
            </div>
          </div>
        );
      case 'low_risk':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Low Risk</div>
              <div className="text-[11px] text-blue-300/80">No direct malicious signatures, minor telemetry detected</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Clean / Safe</div>
              <div className="text-[11px] text-emerald-300/80">No malicious webhooks, stealers, or grabbers detected</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>Security & Threat Intelligence Report</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Audit for Discord webhooks, credential loggers, IP grabbers, and malicious APIs
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Score */}
        {getScoreBadge()}

        {/* Detected Obfuscator Signatures */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Detected Obfuscator Archetypes
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {detectedObfuscators.map((sig, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 border border-zinc-700/70 text-emerald-300"
              >
                {sig}
              </span>
            ))}
          </div>
        </div>

        {/* Flagged Threats */}
        {report.threats.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Flagged Items ({report.threats.length})
            </h3>
            <div className="space-y-2">
              {report.threats.map((threat) => (
                <div
                  key={threat.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    threat.severity === 'high'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : threat.severity === 'medium'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-zinc-900/60 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{threat.title}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        threat.severity === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : threat.severity === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {threat.severity}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">{threat.description}</p>
                  <div className="font-mono text-[11px] bg-zinc-950/80 p-2 rounded text-zinc-300 overflow-x-auto border border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="truncate">{threat.matchedText}</span>
                    {threat.line && (
                      <span className="text-[10px] text-zinc-500 shrink-0">Line {threat.line}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>No malicious webhooks, grabbers, or risky dynamic execution patterns detected.</span>
          </div>
        )}

        {/* Extracted Webhooks */}
        {report.detectedWebhooks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Extracted Discord Webhooks ({report.detectedWebhooks.length})
            </h3>
            <div className="space-y-1.5">
              {report.detectedWebhooks.map((url, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono"
                >
                  <span className="text-rose-300 truncate max-w-[420px]">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(url)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {copiedUrl === url ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl === url ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted URLs */}
        {report.detectedUrls.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              All Extracted URLs & Endpoints ({report.detectedUrls.length})
            </h3>
            <div className="space-y-1">
              {report.detectedUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800 text-xs font-mono"
                >
                  <span className="text-zinc-300 truncate max-w-[420px]">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(url)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {copiedUrl === url ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl === url ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
