/**
 * Luau Deobfuscator Pro - Core Type Definitions
 */

export interface DeobfOptions {
  decodeStrings: boolean;
  decodeHexEscapes: boolean;
  decodeCharCodes: boolean;
  decodeXorPatterns: boolean;
  resolveTableLookups: boolean;
  constantFolding: boolean;
  deadCodeElimination: boolean;
  inlineProxies: boolean;
  normalizeIdentifiers: boolean;
  identifierStyle: 'numbered' | 'semantic' | 'keep';
  formatCode: boolean;
  indentStyle: '2spaces' | '4spaces' | 'tabs';
  simplifyLuauTypes: boolean;
  detectThreats: boolean;
}

export interface SecurityThreat {
  id: string;
  type: 'discord_webhook' | 'http_request' | 'loadstring' | 'credential_theft' | 'ip_grabber' | 'suspicious_telemetry';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  matchedText: string;
  line?: number;
}

export interface SecurityReport {
  score: 'safe' | 'low_risk' | 'suspicious' | 'dangerous';
  threats: SecurityThreat[];
  detectedUrls: string[];
  detectedWebhooks: string[];
  flaggedApis: string[];
}

export interface PipelineStep {
  name: string;
  description: string;
  codeBefore: string;
  codeAfter: string;
  changesCount: number;
  durationMs: number;
}

export interface DeobfStats {
  originalSize: number;
  outputSize: number;
  originalLines: number;
  outputLines: number;
  stringsDecoded: number;
  constantsFolded: number;
  deadBranchesRemoved: number;
  identifiersNormalized: number;
  totalTimeMs: number;
}

export interface DeobfResult {
  originalCode: string;
  deobfuscatedCode: string;
  stats: DeobfStats;
  steps: PipelineStep[];
  securityReport: SecurityReport;
  detectedObfuscators: string[];
}

export interface ScriptSample {
  id: string;
  name: string;
  category: 'Roblox Executor' | 'String Encryption' | 'Control Flow' | 'Malware / Stealer' | 'Table Lookup';
  description: string;
  code: string;
}
