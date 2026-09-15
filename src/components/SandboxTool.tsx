/**
 * Sandbox Decoder & Helper Tool
 * Allows instant decoding of arbitrary byte sequences, hex strings, XOR streams, and Base64
 */

import React, { useState } from 'react';
import { Terminal, ArrowRight, Copy, Check, RefreshCw } from 'lucide-react';
import { sanitizeLuaString } from '../lib/deobf/decoder';

export const SandboxTool: React.FC = () => {
  const [input, setInput] = useState('string.char(104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100)');
  const [output, setOutput] = useState('');
  const [xorKey, setXorKey] = useState('32');
  const [mode, setMode] = useState<'char' | 'hex' | 'xor' | 'base64'>('char');
  const [copied, setCopied] = useState(false);

  const handleRun = () => {
    try {
      if (mode === 'char') {
        // Extract numbers from string.char(...) or comma list
        const nums = input.match(/\d+/g);
        if (nums) {
          const res = nums.map((n) => String.fromCharCode(parseInt(n, 10))).join('');
          setOutput(res);
        } else {
          setOutput('No valid decimal byte numbers found.');
        }
      } else if (mode === 'hex') {
        // Hex escapes like \x48\x65 or raw hex string
        const cleaned = input.replace(/\\x/g, '').replace(/\s+/g, '');
        let res = '';
        for (let i = 0; i < cleaned.length; i += 2) {
          const byte = parseInt(cleaned.substr(i, 2), 16);
          if (!isNaN(byte)) {
            res += String.fromCharCode(byte);
          }
        }
        setOutput(res);
      } else if (mode === 'xor') {
        const key = parseInt(xorKey, 10) || 0;
        const nums = input.match(/\d+/g);
        if (nums) {
          const res = nums.map((n) => String.fromCharCode((parseInt(n, 10) ^ key) & 0xff)).join('');
          setOutput(res);
        } else {
          // XOR string directly
          let res = '';
          for (let i = 0; i < input.length; i++) {
            res += String.fromCharCode((input.charCodeAt(i) ^ key) & 0xff);
          }
          setOutput(res);
        }
      } else if (mode === 'base64') {
        try {
          setOutput(atob(input.trim()));
        } catch {
          setOutput('Invalid Base64 string.');
        }
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200">Interactive Byte / XOR Sandbox</span>
        </div>

        <div className="flex items-center gap-1">
          {(['char', 'hex', 'xor', 'base64'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                if (m === 'char') setInput('string.char(82, 111, 98, 108, 111, 120)');
                if (m === 'hex') setInput('\\x57\\x6f\\x72\\x6c\\x64');
                if (m === 'xor') setInput('114, 111, 98, 108, 111, 120');
                if (m === 'base64') setInput('SGVsbG8gTHVhdSE=');
              }}
              className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                mode === m
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Input Cipher / Bytes:</span>
            {mode === 'xor' && (
              <div className="flex items-center gap-1.5">
                <span>Key (0-255):</span>
                <input
                  type="number"
                  value={xorKey}
                  onChange={(e) => setXorKey(e.target.value)}
                  className="w-14 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-200"
                />
              </div>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 outline-none resize-none font-mono text-xs focus:border-zinc-700"
            placeholder="Enter string.char(), \\x hex sequence, or bytes..."
          />
        </div>

        {/* Output */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Decoded Result:</span>
            {output && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
          <div className="w-full h-[74px] p-2.5 rounded bg-zinc-900/90 border border-zinc-800 text-emerald-300 font-mono text-xs overflow-auto select-all">
            {output || <span className="text-zinc-600">Click Decode to evaluate...</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleRun}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold rounded text-xs transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Decode Snippet</span>
        </button>
      </div>
    </div>
  );
};
