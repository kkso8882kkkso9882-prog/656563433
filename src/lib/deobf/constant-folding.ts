/**
 * Constant Folding & Expression Simplifier for Luau / Lua
 */

import { sanitizeLuaString } from './decoder';

export function foldConstants(code: string): { code: string; count: number } {
  let count = 0;
  let current = code;
  let changed = true;
  let passes = 0;

  while (changed && passes < 10) {
    passes++;
    changed = false;

    // 1. Fold string library methods with static constants
    const stringFoldRes = foldStringLibrary(current);
    if (stringFoldRes.count > 0) {
      count += stringFoldRes.count;
      current = stringFoldRes.code;
      changed = true;
    }

    // 2. Fold math library methods with static constants
    const mathFoldRes = foldMathLibrary(current);
    if (mathFoldRes.count > 0) {
      count += mathFoldRes.count;
      current = mathFoldRes.code;
      changed = true;
    }

    // 3. Fold bit32 library calls
    const bit32FoldRes = foldBit32Library(current);
    if (bit32FoldRes.count > 0) {
      count += bit32FoldRes.count;
      current = bit32FoldRes.code;
      changed = true;
    }

    // 4. Fold boolean logic (not true, not not false, etc.)
    const boolFoldRes = foldBooleanExpressions(current);
    if (boolFoldRes.count > 0) {
      count += boolFoldRes.count;
      current = boolFoldRes.code;
      changed = true;
    }

    // 5. Fold simple pure arithmetic expressions: (number op number)
    const arithFoldRes = foldArithmetic(current);
    if (arithFoldRes.count > 0) {
      count += arithFoldRes.count;
      current = arithFoldRes.code;
      changed = true;
    }
  }

  return { code: current, count };
}

/**
 * Folds math.floor, math.abs, math.min, math.max, math.sqrt
 */
function foldMathLibrary(code: string): { code: string; count: number } {
  let count = 0;

  // math.floor(num)
  let result = code.replace(/math\.floor\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/g, (_, n) => {
    count++;
    return String(Math.floor(parseFloat(n)));
  });

  // math.ceil(num)
  result = result.replace(/math\.ceil\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/g, (_, n) => {
    count++;
    return String(Math.ceil(parseFloat(n)));
  });

  // math.abs(num)
  result = result.replace(/math\.abs\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/g, (_, n) => {
    count++;
    return String(Math.abs(parseFloat(n)));
  });

  // math.sqrt(num)
  result = result.replace(/math\.sqrt\s*\(\s*(\d+(?:\.\d+)?)\s*\)/g, (_, n) => {
    const val = Math.sqrt(parseFloat(n));
    if (Number.isInteger(val)) {
      count++;
      return String(val);
    }
    return `math.sqrt(${n})`;
  });

  // math.min(a, b)
  result = result.replace(/math\.min\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g, (_, a, b) => {
    count++;
    return String(Math.min(parseFloat(a), parseFloat(b)));
  });

  // math.max(a, b)
  result = result.replace(/math\.max\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g, (_, a, b) => {
    count++;
    return String(Math.max(parseFloat(a), parseFloat(b)));
  });

  return { code: result, count };
}

/**
 * Folds string library functions with static strings
 */
function foldStringLibrary(code: string): { code: string; count: number } {
  let count = 0;

  // string.len("str") or #"str"
  let result = code.replace(/string\.len\s*\(\s*(["'])(.*?)\1\s*\)/g, (_, __, str) => {
    count++;
    return String(str.length);
  });
  result = result.replace(/#(["'])(.*?)\1/g, (_, __, str) => {
    count++;
    return String(str.length);
  });

  // string.lower("str")
  result = result.replace(/string\.lower\s*\(\s*(["'])(.*?)\1\s*\)/g, (_, __, str) => {
    count++;
    return sanitizeLuaString(str.toLowerCase());
  });

  // string.upper("str")
  result = result.replace(/string\.upper\s*\(\s*(["'])(.*?)\1\s*\)/g, (_, __, str) => {
    count++;
    return sanitizeLuaString(str.toUpperCase());
  });

  // string.reverse("str")
  result = result.replace(/string\.reverse\s*\(\s*(["'])(.*?)\1\s*\)/g, (_, __, str) => {
    count++;
    return sanitizeLuaString(str.split('').reverse().join(''));
  });

  // string.sub("str", i, j)
  result = result.replace(/string\.sub\s*\(\s*(["'])(.*?)\1\s*,\s*(\d+)(?:\s*,\s*(\d+))?\s*\)/g, (match, _, str, startStr, endStr) => {
    try {
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : str.length;
      if (start >= 1 && end >= start) {
        count++;
        // Lua is 1-indexed
        return sanitizeLuaString(str.slice(start - 1, end));
      }
    } catch {
      return match;
    }
    return match;
  });

  return { code: result, count };
}

/**
 * Folds bit32 calls with numeric literals
 */
function foldBit32Library(code: string): { code: string; count: number } {
  let count = 0;

  // bit32.band(a, b)
  let result = code.replace(/bit32\.band\s*\(\s*(0x[0-9a-fA-F]+|\d+)\s*,\s*(0x[0-9a-fA-F]+|\d+)\s*\)/g, (_, a, b) => {
    count++;
    const v1 = a.startsWith('0x') ? parseInt(a, 16) : parseInt(a, 10);
    const v2 = b.startsWith('0x') ? parseInt(b, 16) : parseInt(b, 10);
    return String((v1 & v2) >>> 0);
  });

  // bit32.bor(a, b)
  result = result.replace(/bit32\.bor\s*\(\s*(0x[0-9a-fA-F]+|\d+)\s*,\s*(0x[0-9a-fA-F]+|\d+)\s*\)/g, (_, a, b) => {
    count++;
    const v1 = a.startsWith('0x') ? parseInt(a, 16) : parseInt(a, 10);
    const v2 = b.startsWith('0x') ? parseInt(b, 16) : parseInt(b, 10);
    return String((v1 | v2) >>> 0);
  });

  // bit32.bxor(a, b)
  result = result.replace(/bit32\.bxor\s*\(\s*(0x[0-9a-fA-F]+|\d+)\s*,\s*(0x[0-9a-fA-F]+|\d+)\s*\)/g, (_, a, b) => {
    count++;
    const v1 = a.startsWith('0x') ? parseInt(a, 16) : parseInt(a, 10);
    const v2 = b.startsWith('0x') ? parseInt(b, 16) : parseInt(b, 10);
    return String((v1 ^ v2) >>> 0);
  });

  // bit32.lshift(a, b)
  result = result.replace(/bit32\.lshift\s*\(\s*(0x[0-9a-fA-F]+|\d+)\s*,\s*(\d+)\s*\)/g, (_, a, b) => {
    count++;
    const v1 = a.startsWith('0x') ? parseInt(a, 16) : parseInt(a, 10);
    const v2 = parseInt(b, 10);
    return String((v1 << v2) >>> 0);
  });

  // bit32.rshift(a, b)
  result = result.replace(/bit32\.rshift\s*\(\s*(0x[0-9a-fA-F]+|\d+)\s*,\s*(\d+)\s*\)/g, (_, a, b) => {
    count++;
    const v1 = a.startsWith('0x') ? parseInt(a, 16) : parseInt(a, 10);
    const v2 = parseInt(b, 10);
    return String(v1 >>> v2);
  });

  return { code: result, count };
}

/**
 * Folds boolean expressions:
 * not not true -> true
 * not not false -> false
 * not false -> true
 * not true -> false
 * 1 == 1 -> true
 * 1 ~= 1 -> false
 */
function foldBooleanExpressions(code: string): { code: string; count: number } {
  let count = 0;

  let result = code;

  // not not true / false
  result = result.replace(/\bnot\s+not\s+(true|false)\b/g, (_, boolVal) => {
    count++;
    return boolVal;
  });

  // not true -> false, not false -> true
  result = result.replace(/\bnot\s+true\b/g, () => {
    count++;
    return 'false';
  });
  result = result.replace(/\bnot\s+false\b/g, () => {
    count++;
    return 'true';
  });

  // 1 == 1 -> true, 0 == 0 -> true, etc.
  result = result.replace(/\b(\d+)\s*==\s*(\1)\b/g, () => {
    count++;
    return 'true';
  });

  // 1 ~= 1 -> false
  result = result.replace(/\b(\d+)\s*~=\s*(\1)\b/g, () => {
    count++;
    return 'false';
  });

  // "abc" == "abc" -> true
  result = result.replace(/(["'])(.*?)\1\s*==\s*\1\2\1/g, () => {
    count++;
    return 'true';
  });

  return { code: result, count };
}

/**
 * Folds safe static binary arithmetic expressions:
 * (number + number), (number - number), (number * number)
 */
function foldArithmetic(code: string): { code: string; count: number } {
  let count = 0;

  // Hex conversion first: 0x10 -> 16 if part of an arithmetic expression
  let result = code.replace(/\b(0x[0-9a-fA-F]+)\s*([+\-*/%])\s*(0x[0-9a-fA-F]+)\b/g, (_, h1, op, h2) => {
    const n1 = parseInt(h1, 16);
    const n2 = parseInt(h2, 16);
    count++;
    return evaluateBinary(n1, op, n2);
  });

  // Parenthesized simple expressions: (5 + 10)
  result = result.replace(/\(\s*(-?\d+(?:\.\d+)?)\s*([+\-*/%])\s*(-?\d+(?:\.\d+)?)\s*\)/g, (match, n1Str, op, n2Str) => {
    const n1 = parseFloat(n1Str);
    const n2 = parseFloat(n2Str);
    count++;
    return evaluateBinary(n1, op, n2);
  });

  // Binary expression without parens when safe (multiplication / division precedence)
  result = result.replace(/\b(\d+)\s*([*/])\s*(\d+)\b/g, (match, n1Str, op, n2Str) => {
    const n1 = parseInt(n1Str, 10);
    const n2 = parseInt(n2Str, 10);
    if (op === '/' && n2 === 0) return match;
    count++;
    return evaluateBinary(n1, op, n2);
  });

  return { code: result, count };
}

function evaluateBinary(n1: number, op: string, n2: number): string {
  switch (op) {
    case '+': return String(n1 + n2);
    case '-': return String(n1 - n2);
    case '*': return String(n1 * n2);
    case '/': return n2 !== 0 ? String(Math.floor(n1 / n2)) : `${n1} / ${n2}`;
    case '%': return n2 !== 0 ? String(n1 % n2) : `${n1} % ${n2}`;
    default: return `${n1} ${op} ${n2}`;
  }
}
