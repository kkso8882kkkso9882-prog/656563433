/**
 * Security, Webhook & Malware Threat Analyzer for Luau Scripts
 */

import { SecurityReport, SecurityThreat } from '../../types';

export function analyzeSecurity(code: string): SecurityReport {
  const threats: SecurityThreat[] = [];
  const detectedUrls: string[] = [];
  const detectedWebhooks: string[] = [];
  const flaggedApis: string[] = [];

  const lines = code.split(/\r?\n/);

  // 1. URL extraction
  const urlRegex = /https?:\/\/[^\s"'`)\],]+/gi;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(code)) !== null) {
    const url = match[0];
    if (!detectedUrls.includes(url)) {
      detectedUrls.push(url);
    }

    // Check if Discord webhook
    if (url.includes('discord.com/api/webhooks') || url.includes('discordapp.com/api/webhooks')) {
      if (!detectedWebhooks.includes(url)) {
        detectedWebhooks.push(url);
      }
      threats.push({
        id: `webhook_${threats.length}`,
        type: 'discord_webhook',
        severity: 'high',
        title: 'Discord Webhook Detected',
        description: 'Script transmits data to an external Discord webhook. Often used for account/credential logging.',
        matchedText: url,
        line: findLineNumber(lines, url)
      });
    }

    // Check for IP grabbers
    if (
      url.includes('api.ipify.org') ||
      url.includes('ip-api.com') ||
      url.includes('ident.me') ||
      url.includes('httpbin.org/ip')
    ) {
      threats.push({
        id: `ip_${threats.length}`,
        type: 'ip_grabber',
        severity: 'high',
        title: 'IP Address Logger Endpoint',
        description: 'Script contacts an external IP address reporting service.',
        matchedText: url,
        line: findLineNumber(lines, url)
      });
    }
  }

  // 2. Cookie / Account Credential Theft
  if (code.includes('.ROBLOSECURITY') || code.includes('Roblosecurity') || /cookie\s*=\s*['"]_\|WARNING/i.test(code)) {
    threats.push({
      id: `cookie_${threats.length}`,
      type: 'credential_theft',
      severity: 'high',
      title: 'Roblox Security Cookie Reference',
      description: 'Found explicit reference to .ROBLOSECURITY token or cookie harvesting logic.',
      matchedText: '.ROBLOSECURITY',
      line: findLineNumber(lines, '.ROBLOSECURITY')
    });
  }

  // 3. Dynamic execution / Loadstring
  const loadstringRegex = /\b(loadstring|load)\s*\(/g;
  while ((match = loadstringRegex.exec(code)) !== null) {
    const apiName = match[1];
    if (!flaggedApis.includes(apiName)) flaggedApis.push(apiName);
    threats.push({
      id: `loadstring_${threats.length}`,
      type: 'loadstring',
      severity: 'medium',
      title: 'Dynamic Code Execution (loadstring)',
      description: 'Executes arbitrary downloaded or runtime-generated Lua bytecode or source.',
      matchedText: match[0],
      line: findLineNumber(lines, match[0])
    });
  }

  // 4. HTTP Request APIs
  const httpApis = [
    'HttpService:PostAsync',
    'HttpService:GetAsync',
    'HttpService:RequestAsync',
    'syn.request',
    'http_request',
    'request',
    'fluxus.request'
  ];

  for (const api of httpApis) {
    if (code.includes(api)) {
      if (!flaggedApis.includes(api)) flaggedApis.push(api);
      threats.push({
        id: `http_${threats.length}`,
        type: 'http_request',
        severity: 'medium',
        title: `External HTTP API (${api})`,
        description: 'Performs external network communication from the script.',
        matchedText: api,
        line: findLineNumber(lines, api)
      });
    }
  }

  // 5. Clipboard Manipulation
  if (code.includes('setclipboard') || code.includes('toclipboard')) {
    threats.push({
      id: `clip_${threats.length}`,
      type: 'suspicious_telemetry',
      severity: 'low',
      title: 'Clipboard Hijacking / Writing',
      description: 'Script attempts to write data to the user operating system clipboard.',
      matchedText: 'setclipboard',
      line: findLineNumber(lines, 'setclipboard')
    });
  }

  // Determine overall score
  let score: SecurityReport['score'] = 'safe';
  const hasHigh = threats.some((t) => t.severity === 'high');
  const hasMed = threats.some((t) => t.severity === 'medium');

  if (hasHigh) {
    score = 'dangerous';
  } else if (hasMed) {
    score = 'suspicious';
  } else if (threats.length > 0) {
    score = 'low_risk';
  }

  return {
    score,
    threats,
    detectedUrls,
    detectedWebhooks,
    flaggedApis
  };
}

/**
 * Detects known obfuscator signatures
 */
export function detectObfuscatorSignatures(code: string): string[] {
  const signatures: string[] = [];

  if (/Luraph\s+Script/i.test(code) || /LPH_/i.test(code) || /luraph/i.test(code)) {
    signatures.push('Luraph Obfuscator');
  }
  if (/IronBrew/i.test(code) || /IB_/i.test(code) || /IronBrew2/i.test(code)) {
    signatures.push('IronBrew / IB2');
  }
  if (/Moonsec/i.test(code) || /MoonSecV/i.test(code)) {
    signatures.push('Moonsec Obfuscator');
  }
  if (/Prometheus/i.test(code) || /prometheus/i.test(code)) {
    signatures.push('Prometheus Lua');
  }
  if (/PSU\s+Obfuscator/i.test(code) || /Boron/i.test(code)) {
    signatures.push('PSU / Boron VM');
  }
  if (/Aztup/i.test(code)) {
    signatures.push('Aztup Brew');
  }
  if (/string\.char\s*\(\s*bit32\.bxor/i.test(code) || /string\.char\s*\(\s*\d+\s*~/i.test(code)) {
    signatures.push('Custom XOR Stream');
  }
  if (/^[Il1O0_]{4,}/m.test(code)) {
    signatures.push('Barcode Variable Scrambler');
  }
  if (/\\x[0-9a-fA-F]{2}\\x[0-9a-fA-F]{2}\\x[0-9a-fA-F]{2}/.test(code)) {
    signatures.push('Hex Escape Packer');
  }

  return signatures.length > 0 ? signatures : ['Generic Luau Obfuscation'];
}

function findLineNumber(lines: string[], text: string): number | undefined {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(text)) {
      return i + 1;
    }
  }
  return undefined;
}
