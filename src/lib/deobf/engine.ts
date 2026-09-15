/**
 * Luau Deobfuscator Pro - Pipeline Orchestrator Engine
 */

import { DeobfOptions, DeobfResult, PipelineStep, DeobfStats } from '../../types';
import {
  decodeEscapeSequences,
  decodeStringChar,
  foldStringConcatenations,
  resolveStringTableLookups,
  decodeXorStrings,
  simplifyObjectIndexing
} from './decoder';
import { foldConstants } from './constant-folding';
import { recoverControlFlow, inlineProxyFunctions } from './control-flow';
import { normalizeIdentifiers } from './renamer';
import { formatLuauCode } from './formatter';
import { analyzeSecurity, detectObfuscatorSignatures } from './security-analyzer';

export function runDeobfuscation(code: string, options: DeobfOptions): DeobfResult {
  const startTime = performance.now();
  const steps: PipelineStep[] = [];

  let currentCode = code;
  let totalStringsDecoded = 0;
  let totalConstantsFolded = 0;
  let totalDeadBranchesRemoved = 0;
  let totalIdentifiersNormalized = 0;

  // PASS 1: String Escape Sequences & String.char Decoding
  if (options.decodeStrings) {
    const stepStart = performance.now();
    const before = currentCode;
    let stepChanges = 0;

    if (options.decodeHexEscapes) {
      const hexRes = decodeEscapeSequences(currentCode);
      currentCode = hexRes.code;
      stepChanges += hexRes.count;
    }

    if (options.decodeCharCodes) {
      const charRes = decodeStringChar(currentCode);
      currentCode = charRes.code;
      stepChanges += charRes.count;
    }

    if (options.decodeXorPatterns) {
      const xorRes = decodeXorStrings(currentCode);
      currentCode = xorRes.code;
      stepChanges += xorRes.count;
    }

    // Fold string concatenations: "a" .. "b" -> "ab"
    const concatRes = foldStringConcatenations(currentCode);
    currentCode = concatRes.code;
    stepChanges += concatRes.count;

    totalStringsDecoded += stepChanges;
    steps.push({
      name: 'String Decryption',
      description: 'Decoded hex/unicode escapes, string.char byte streams, and folded concatenations.',
      codeBefore: before,
      codeAfter: currentCode,
      changesCount: stepChanges,
      durationMs: Math.round(performance.now() - stepStart)
    });
  }

  // PASS 2: Table Lookup Resolution & Object Indexing
  if (options.resolveTableLookups) {
    const stepStart = performance.now();
    const before = currentCode;
    let stepChanges = 0;

    const tableRes = resolveStringTableLookups(currentCode);
    currentCode = tableRes.code;
    stepChanges += tableRes.count;

    const indexRes = simplifyObjectIndexing(currentCode);
    currentCode = indexRes.code;
    stepChanges += indexRes.count;

    // Concatenate any newly resolved strings
    const reConcatRes = foldStringConcatenations(currentCode);
    currentCode = reConcatRes.code;
    stepChanges += reConcatRes.count;

    steps.push({
      name: 'Table Lookups & Properties',
      description: 'Inlined string lookup tables, array indices, and converted bracket access to dot properties.',
      codeBefore: before,
      codeAfter: currentCode,
      changesCount: stepChanges,
      durationMs: Math.round(performance.now() - stepStart)
    });
  }

  // PASS 3: Constant Folding & Expression Simplification
  if (options.constantFolding) {
    const stepStart = performance.now();
    const before = currentCode;

    const foldRes = foldConstants(currentCode);
    currentCode = foldRes.code;
    totalConstantsFolded += foldRes.count;

    steps.push({
      name: 'Constant Folding',
      description: 'Evaluated static math, bit32 operations, boolean logic, and static string methods.',
      codeBefore: before,
      codeAfter: currentCode,
      changesCount: foldRes.count,
      durationMs: Math.round(performance.now() - stepStart)
    });
  }

  // PASS 4: Control Flow Recovery & Dead Code Elimination
  if (options.deadCodeElimination) {
    const stepStart = performance.now();
    const before = currentCode;

    const flowRes = recoverControlFlow(currentCode);
    currentCode = flowRes.code;
    totalDeadBranchesRemoved += flowRes.count;

    steps.push({
      name: 'Control Flow Recovery',
      description: 'Removed opaque predicates, pruned dead if-branches, and unrolled one-shot repeat loops.',
      codeBefore: before,
      codeAfter: currentCode,
      changesCount: flowRes.count,
      durationMs: Math.round(performance.now() - stepStart)
    });
  }

  // PASS 5: Proxy Function Inlining
  if (options.inlineProxies) {
    const stepStart = performance.now();
    const before = currentCode;

    const proxyRes = inlineProxyFunctions(currentCode);
    currentCode = proxyRes.code;

    // Re-fold if proxy inlining created more constants
    if (options.constantFolding && proxyRes.count > 0) {
      const secondFold = foldConstants(currentCode);
      currentCode = secondFold.code;
      totalConstantsFolded += secondFold.count;
    }

    steps.push({
      name: 'Proxy Inlining',
      description: 'Inlined wrapper dispatchers and proxy functions that only forward calls or operations.',
      codeBefore: before,
      codeAfter: currentCode,
      changesCount: proxyRes.count,
      durationMs: Math.round(performance.now() - stepStart)
    });
  }

  // PASS 6: Identifier Normalization
  if (options.normalizeIdentifiers && options.identifierStyle !== 'keep') {
    const stepStart = performance.now();
    const before = currentCode;

    const renameRes = normalizeIdentifiers(currentCode, options.identifierStyle);
    currentCode = renameRes.code;
    totalIdentifiersNormalized += renameRes.count;

    steps.push({
      name: 'Identifier Normalization',
      description: 'Replaced barcode, hex-scrambled, and randomized variable names with clean identifiers.',
      codeBefore: before,
      codeAfter: currentCode,
      changesCount: renameRes.count,
      durationMs: Math.round(performance.now() - stepStart)
    });
  }

  // PASS 7: Luau Code Formatting & Beautification
  if (options.formatCode) {
    const stepStart = performance.now();
    const before = currentCode;

    currentCode = formatLuauCode(currentCode, {
      indentStyle: options.indentStyle,
      simplifyLuauTypes: options.simplifyLuauTypes
    });

    steps.push({
      name: 'Beautifier & Formatting',
      description: 'Structured block indentation, balanced operator spacing, and cleaned Luau types.',
      codeBefore: before,
      codeAfter: currentCode,
      changesCount: 1,
      durationMs: Math.round(performance.now() - stepStart)
    });
  }

  // PASS 8: Security and Obfuscator Signatures
  const securityReport = options.detectThreats
    ? analyzeSecurity(currentCode)
    : { score: 'safe' as const, threats: [], detectedUrls: [], detectedWebhooks: [], flaggedApis: [] };

  const detectedObfuscators = detectObfuscatorSignatures(code);

  const totalTimeMs = Math.round(performance.now() - startTime);

  const stats: DeobfStats = {
    originalSize: new Blob([code]).size,
    outputSize: new Blob([currentCode]).size,
    originalLines: code.split('\n').length,
    outputLines: currentCode.split('\n').length,
    stringsDecoded: totalStringsDecoded,
    constantsFolded: totalConstantsFolded,
    deadBranchesRemoved: totalDeadBranchesRemoved,
    identifiersNormalized: totalIdentifiersNormalized,
    totalTimeMs
  };

  return {
    originalCode: code,
    deobfuscatedCode: currentCode,
    stats,
    steps,
    securityReport,
    detectedObfuscators
  };
}

export const DEFAULT_DEOBF_OPTIONS: DeobfOptions = {
  decodeStrings: true,
  decodeHexEscapes: true,
  decodeCharCodes: true,
  decodeXorPatterns: true,
  resolveTableLookups: true,
  constantFolding: true,
  deadCodeElimination: true,
  inlineProxies: true,
  normalizeIdentifiers: true,
  identifierStyle: 'semantic',
  formatCode: true,
  indentStyle: '2spaces',
  simplifyLuauTypes: true,
  detectThreats: true
};
