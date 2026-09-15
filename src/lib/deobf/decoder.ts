/**
 * String Decoder & Table Lookup Resolver for Luau / Lua
 */

// Helper to escape printable vs non-printable characters for Lua output
export function sanitizeLuaString(str: string): string {
  // If string contains non-printable characters, escape them
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const char = str[i];
    if (char === '\\') {
      result += '\\\\';
    } else if (char === '"') {
      result += '\\"';
    } else if (char === '\n') {
      result += '\\n';
    } else if (char === '\r') {
      result += '\\r';
    } else if (char === '\t') {
      result += '\\t';
    } else if (code >= 32 && code <= 126) {
      result += char;
    } else {
      // Unprintable byte: emit \ddd or \xHH
      result += '\\' + code.toString().padStart(3, '0');
    }
  }
  return `"${result}"`;
}

/**
 * Decodes hex escapes (\x41), decimal escapes (\065), and unicode escapes (\u{0041})
 * within quoted string literals.
 */
export function decodeEscapeSequences(code: string): { code: string; count: number } {
  let count = 0;

  // Match double-quoted and single-quoted string literals in Lua
  const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;

  const transformed = code.replace(stringRegex, (match) => {
    // Check if it has any escape sequences
    if (!match.includes('\\')) return match;

    const quote = match[0];
    const inner = match.slice(1, -1);

    let decoded = '';
    let i = 0;
    let modified = false;

    while (i < inner.length) {
      if (inner[i] === '\\' && i + 1 < inner.length) {
        const next = inner[i + 1];

        // Hex escape: \xHH
        if (next === 'x' && i + 3 < inner.length) {
          const hex = inner.substring(i + 2, i + 4);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            const charCode = parseInt(hex, 16);
            decoded += String.fromCharCode(charCode);
            i += 4;
            modified = true;
            count++;
            continue;
          }
        }

        // Unicode escape: \u{HHHH}
        if (next === 'u' && inner[i + 2] === '{') {
          const closeIdx = inner.indexOf('}', i + 3);
          if (closeIdx !== -1 && closeIdx - i <= 10) {
            const hex = inner.substring(i + 3, closeIdx);
            if (/^[0-9a-fA-F]+$/.test(hex)) {
              try {
                const codePoint = parseInt(hex, 16);
                decoded += String.fromCodePoint(codePoint);
                i = closeIdx + 1;
                modified = true;
                count++;
                continue;
              } catch {
                // fallback
              }
            }
          }
        }

        // Decimal escape: \ddd (1 to 3 digits)
        const decMatch = inner.slice(i + 1).match(/^([0-9]{1,3})/);
        if (decMatch) {
          const charCode = parseInt(decMatch[1], 10);
          if (charCode <= 255) {
            decoded += String.fromCharCode(charCode);
            i += 1 + decMatch[1].length;
            modified = true;
            count++;
            continue;
          }
        }

        // Standard escapes
        if (next === 'n') { decoded += '\n'; i += 2; continue; }
        if (next === 't') { decoded += '\t'; i += 2; continue; }
        if (next === 'r') { decoded += '\r'; i += 2; continue; }
        if (next === '\\') { decoded += '\\'; i += 2; continue; }
        if (next === quote) { decoded += quote; i += 2; continue; }

        decoded += inner[i];
        i++;
      } else {
        decoded += inner[i];
        i++;
      }
    }

    if (modified) {
      return sanitizeLuaString(decoded);
    }
    return match;
  });

  return { code: transformed, count };
}

/**
 * Decodes string.char(104, 101, 108, 108, 111) calls
 */
export function decodeStringChar(code: string): { code: string; count: number } {
  let count = 0;

  // Match string.char(number, number, ...) or ('string')['char'](...)
  const charRegex = /(?:string\.char|\(['"]string['"]\)\[['"]char['"]\])\s*\(\s*([0-9a-fA-FxX\s,+-/*]+)\s*\)/g;

  const transformed = code.replace(charRegex, (fullMatch, argsString) => {
    try {
      const parts = argsString.split(',').map((p: string) => p.trim());
      const chars: string[] = [];

      for (const part of parts) {
        if (!part) continue;
        // Evaluate simple arithmetic if present (e.g., 0x20 + 5 or 100)
        let num: number;
        if (/^0x[0-9a-fA-F]+$/i.test(part)) {
          num = parseInt(part, 16);
        } else if (/^-?\d+$/.test(part)) {
          num = parseInt(part, 10);
        } else if (/^[-+*/0-9a-fA-FxX\s()]+$/.test(part)) {
          // Safe small math evaluator
          // eslint-disable-next-line no-eval
          const val = Function(`'use strict'; return (${part})`)();
          if (typeof val === 'number') {
            num = Math.floor(val);
          } else {
            return fullMatch;
          }
        } else {
          return fullMatch;
        }

        if (num < 0 || num > 255) return fullMatch;
        chars.push(String.fromCharCode(num));
      }

      if (chars.length > 0) {
        count++;
        return sanitizeLuaString(chars.join(''));
      }
    } catch {
      return fullMatch;
    }
    return fullMatch;
  });

  return { code: transformed, count };
}

/**
 * Folds adjacent string concatenations: "foo" .. "bar" -> "foobar"
 */
export function foldStringConcatenations(code: string): { code: string; count: number } {
  let count = 0;
  let current = code;
  let changed = true;

  // Iteratively fold "..." .. "..."
  const concatRegex = /(["'])(?:(?=(\\?))\2.)*?\1\s*\.\.\s*(["'])(?:(?=(\\?))\4.)*?\3/;

  let iterations = 0;
  while (changed && iterations < 50) {
    iterations++;
    changed = false;
    current = current.replace(concatRegex, (match) => {
      const parts = match.split(/\s*\.\.\s*/);
      if (parts.length === 2) {
        try {
          const s1 = parseLuaLiteralString(parts[0]);
          const s2 = parseLuaLiteralString(parts[1]);
          if (s1 !== null && s2 !== null) {
            count++;
            changed = true;
            return sanitizeLuaString(s1 + s2);
          }
        } catch {
          return match;
        }
      }
      return match;
    });
  }

  return { code: current, count };
}

/**
 * Parses a Lua quoted literal into a raw string
 */
function parseLuaLiteralString(literal: string): string | null {
  const trimmed = literal.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const raw = trimmed.slice(1, -1);
    // Replace standard escapes
    return raw
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }
  return null;
}

/**
 * Resolves static table lookups where a string pool is defined:
 * local strings = { [1] = "game", [2] = "Players" } ... strings[1]
 * or local t = {"game", "Players"} ... t[1]
 */
export function resolveStringTableLookups(code: string): { code: string; count: number } {
  let count = 0;
  let current = code;

  // Pattern 1: Array-like string table: local tblName = { "str1", "str2", ... }
  const tableDeclRegex = /local\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\{\s*([^{}]+?)\s*\}(?=[;\n\r]|\s+local|\s+[a-zA-Z_])/g;

  const tables = new Map<string, Map<number | string, string>>();

  let match: RegExpExecArray | null;
  while ((match = tableDeclRegex.exec(code)) !== null) {
    const tableName = match[1];
    const content = match[2];

    const entries = new Map<number | string, string>();
    // Check if it's key-value or simple array
    const parts = splitTableItems(content);
    let autoIndex = 1;

    for (const part of parts) {
      const kvMatch = part.match(/^\s*(?:\[\s*(?:(\d+)|["']([^"']+)["'])\s*\])\s*=\s*(["'](?:(?=(\\?))\4.)*?["'])\s*$/);
      if (kvMatch) {
        const key = kvMatch[1] ? parseInt(kvMatch[1], 10) : kvMatch[2];
        const valStr = parseLuaLiteralString(kvMatch[3]);
        if (valStr !== null) {
          entries.set(key, valStr);
        }
      } else {
        const valStr = parseLuaLiteralString(part);
        if (valStr !== null) {
          entries.set(autoIndex++, valStr);
        }
      }
    }

    if (entries.size > 0) {
      tables.set(tableName, entries);
    }
  }

  // Replace usages: tableName[1] or tableName["key"]
  tables.forEach((entries, tblName) => {
    // Number index: tblName[1]
    const numUsageRegex = new RegExp(`\\b${tblName}\\s*\\[\\s*(\\d+)\\s*\\]`, 'g');
    current = current.replace(numUsageRegex, (fullMatch, idxStr) => {
      const idx = parseInt(idxStr, 10);
      if (entries.has(idx)) {
        count++;
        return sanitizeLuaString(entries.get(idx)!);
      }
      return fullMatch;
    });

    // String index: tblName["key"]
    const strUsageRegex = new RegExp(`\\b${tblName}\\s*\\[\\s*["']([^"']+)["']\\s*\\]`, 'g');
    current = current.replace(strUsageRegex, (fullMatch, keyStr) => {
      if (entries.has(keyStr)) {
        count++;
        return sanitizeLuaString(entries.get(keyStr)!);
      }
      return fullMatch;
    });
  });

  return { code: current, count };
}

/**
 * Splits comma-separated table elements respecting quotes
 */
function splitTableItems(content: string): string[] {
  const items: string[] = [];
  let cur = '';
  let inQuote: string | null = null;
  let inBracket = 0;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuote) {
      cur += c;
      if (c === inQuote && content[i - 1] !== '\\') {
        inQuote = null;
      }
    } else {
      if (c === '"' || c === "'") {
        inQuote = c;
        cur += c;
      } else if (c === '[') {
        inBracket++;
        cur += c;
      } else if (c === ']') {
        inBracket--;
        cur += c;
      } else if (c === ',' && inBracket === 0) {
        items.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
  }

  if (cur.trim()) {
    items.push(cur.trim());
  }

  return items;
}

/**
 * Decodes common XOR decryptor loops in Luau obfuscators
 * (like IronBrew, Moonsec, Prometheus, custom XOR strings)
 */
export function decodeXorStrings(code: string): { code: string; count: number } {
  let count = 0;
  let result = code;

  // Pattern 1: Inline byte arrays with XOR:
  // e.g. function(tbl, key) ... return string.char(byte ~ key)
  // Check for common patterns: bit32.bxor(a, b) or (a ~ b)
  const xorArrayPattern = /\{\s*([0-9,\s]+)\s*\}\s*,\s*(\d+)/g;
  // If user has defined a known XOR decryptor structure, we can detect it
  // Let's also look for `string.char(bit32.bxor(byte, key))`
  const directBxorPattern = /string\.char\s*\(\s*bit32\.bxor\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*\)/g;
  result = result.replace(directBxorPattern, (match, b1, b2) => {
    const n1 = parseInt(b1, 10);
    const n2 = parseInt(b2, 10);
    const decodedByte = (n1 ^ n2) & 0xff;
    count++;
    return sanitizeLuaString(String.fromCharCode(decodedByte));
  });

  // Luau operator ~ (bitwise XOR)
  const directTildePattern = /string\.char\s*\(\s*(\d+)\s*~\s*(\d+)\s*\)/g;
  result = result.replace(directTildePattern, (match, b1, b2) => {
    const n1 = parseInt(b1, 10);
    const n2 = parseInt(b2, 10);
    const decodedByte = (n1 ^ n2) & 0xff;
    count++;
    return sanitizeLuaString(String.fromCharCode(decodedByte));
  });

  return { code: result, count };
}

/**
 * Simplifies brackets indexing:
 * _G["print"] -> print
 * game["Players"] -> game.Players
 * workspace["Part"] -> workspace.Part
 */
export function simplifyObjectIndexing(code: string): { code: string; count: number } {
  let count = 0;

  // obj["prop"] -> obj.prop (only if prop is a valid Lua identifier)
  const bracketRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*["']([a-zA-Z_][a-zA-Z0-9_]*)["']\s*\]/g;

  const reservedKeywords = new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
    'true', 'until', 'while'
  ]);

  const transformed = code.replace(bracketRegex, (match, obj, prop) => {
    if (reservedKeywords.has(prop)) {
      return match;
    }
    count++;
    if (obj === '_G') {
      return prop;
    }
    return `${obj}.${prop}`;
  });

  return { code: transformed, count };
}
