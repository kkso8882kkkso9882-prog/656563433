/**
 * Identifier Renamer & Normalizer for Luau / Lua
 * Intelligently recognizes and simplifies obfuscated identifiers (hex-names, barcodes, hash-names)
 * while strictly protecting all Roblox, Luau, and exploit environment globals.
 */

// Reserved keywords in Luau
const RESERVED_KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while', 'continue', 'type', 'export'
]);

// Roblox and Standard Lua Globals that must never be renamed
const PROTECTED_GLOBALS = new Set([
  // Lua Standard Globals
  '_G', '_VERSION', 'assert', 'collectgarbage', 'error', 'getfenv', 'getmetatable',
  'ipairs', 'loadstring', 'next', 'pairs', 'pcall', 'print', 'rawequal', 'rawget',
  'rawlen', 'rawset', 'select', 'setfenv', 'setmetatable', 'tonumber', 'tostring',
  'type', 'typeof', 'unpack', 'warn', 'xpcall',

  // Standard Libraries
  'coroutine', 'debug', 'math', 'os', 'string', 'table', 'utf8', 'bit32', 'task',

  // Roblox Engine Globals & Data Types
  'game', 'workspace', 'script', 'plugin', 'shared', 'Enum', 'Instance',
  'Vector2', 'Vector3', 'Vector3int16', 'Vector2int16', 'CFrame', 'Color3',
  'ColorSequence', 'ColorSequenceKeypoint', 'NumberRange', 'NumberSequence',
  'NumberSequenceKeypoint', 'Ray', 'RaycastParams', 'Rect', 'Region3',
  'Region3int16', 'TweenInfo', 'UDim', 'UDim2', 'BrickColor', 'Axes', 'Faces',
  'PhysicalProperties', 'Random', 'DateTime', 'Font', 'SharedTable',

  // Common Exploit / Executor Functions & Globals
  'getgenv', 'getrenv', 'getreg', 'getgc', 'getinstances', 'getnilinstances',
  'getloadedmodules', 'getconnections', 'firesignal', 'fireclickdetector',
  'fireproximityprompt', 'firetouchinterest', 'hookfunction', 'hookmetamethod',
  'newcclosure', 'replaceclosure', 'checkcaller', 'getnamecallmethod',
  'setnamecallmethod', 'getrawmetatable', 'setrawmetatable', 'setreadonly',
  'isreadonly', 'make_writeable', 'identifyexecutor', 'isexecutorclosure',
  'request', 'http_request', 'syn', 'fluxus', 'krnl', 'readfile', 'writefile',
  'appendfile', 'makefolder', 'delfile', 'delfolder', 'listfiles', 'isfile',
  'isfolder', 'setclipboard', 'toclipboard', 'rconsolename', 'rconsoleprint',
  'rconsolewarn', 'rconsoleerr', 'rconsoleclear', 'rconsoleinput', 'mouse1click',
  'mouse2click', 'mouse1press', 'mouse1release', 'mouse2press', 'mouse2release',
  'mousemoveabs', 'mousemoverel', 'keypress', 'keyrelease', 'keyclick'
]);

/**
 * Checks if an identifier looks obfuscated:
 * - Barcode identifiers: composed only of I, l, 1, O, 0, _
 * - Hex-style identifiers: _0x..., v_0x..., 0x...
 * - Random looking alphanumeric sequences with mixed case & numbers
 * - Consecutive underscores: ___, _1_2_
 */
export function isObfuscatedIdentifier(name: string): boolean {
  if (RESERVED_KEYWORDS.has(name) || PROTECTED_GLOBALS.has(name)) {
    return false;
  }

  // 1. Barcode names: e.g. IlIIlIllI, l1l1l1, O0O0O0
  if (/^[Il1O0_]{4,}$/.test(name)) {
    return true;
  }

  // 2. Hex prefixed or hex heavy: _0x1a8f, v_0x9b, etc.
  if (/^(_?0x[0-9a-fA-F]+|[a-zA-Z]_0x[0-9a-fA-F]+)$/i.test(name)) {
    return true;
  }

  // 3. Excessively underscores: e.g. ____, _1_3_5
  if (/^_{2,}/.test(name) || /(_\d+){3,}/.test(name)) {
    return true;
  }

  // 4. Random base64/hex-like junk (e.g. a8f9c2d1b or O0o0oO)
  if (/^[a-fA-F0-9]{8,}$/.test(name)) {
    return true;
  }

  return false;
}

/**
 * Normalizes all obfuscated variables in the script
 */
export function normalizeIdentifiers(
  code: string,
  style: 'numbered' | 'semantic' | 'keep'
): { code: string; count: number } {
  if (style === 'keep') {
    return { code, count: 0 };
  }

  // Step 1: Tokenize identifiers outside of string literals and comments
  const identifierMap = new Map<string, string>();
  let varCounter = 1;
  let fnCounter = 1;
  let tblCounter = 1;

  // Mask string literals and comments to safely identify symbols
  const strings: string[] = [];
  const comments: string[] = [];

  // Protect comments
  let masked = code.replace(/--\[\[[\s\S]*?\]\]/g, (match) => {
    comments.push(match);
    return `___COMMENT_${comments.length - 1}___`;
  });
  masked = masked.replace(/--.*$/gm, (match) => {
    comments.push(match);
    return `___COMMENT_${comments.length - 1}___`;
  });

  // Protect strings
  masked = masked.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    strings.push(match);
    return `___STRING_${strings.length - 1}___`;
  });

  // Find all candidate identifiers
  const identRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  let match: RegExpExecArray | null;

  while ((match = identRegex.exec(masked)) !== null) {
    const name = match[1];

    if (name.startsWith('___STRING_') || name.startsWith('___COMMENT_')) {
      continue;
    }

    if (isObfuscatedIdentifier(name) && !identifierMap.has(name)) {
      let newName = '';
      if (style === 'semantic') {
        // Attempt role guess
        if (name.toLowerCase().includes('fn') || name.toLowerCase().includes('func')) {
          newName = `fn_${fnCounter++}`;
        } else if (name.toLowerCase().includes('tbl') || name.toLowerCase().includes('arr')) {
          newName = `tbl_${tblCounter++}`;
        } else {
          newName = `var_${varCounter++}`;
        }
      } else {
        newName = `v${varCounter++}`;
      }
      identifierMap.set(name, newName);
    }
  }

  if (identifierMap.size === 0) {
    return { code, count: 0 };
  }

  // Replace identifiers in the masked code
  let replaced = masked.replace(identRegex, (fullMatch, name) => {
    if (identifierMap.has(name)) {
      return identifierMap.get(name)!;
    }
    return fullMatch;
  });

  // Restore strings and comments
  strings.forEach((str, idx) => {
    replaced = replaced.replace(`___STRING_${idx}___`, () => str);
  });
  comments.forEach((comm, idx) => {
    replaced = replaced.replace(`___COMMENT_${idx}___`, () => comm);
  });

  return { code: replaced, count: identifierMap.size };
}
