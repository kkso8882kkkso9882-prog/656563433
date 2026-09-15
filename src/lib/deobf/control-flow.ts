/**
 * Control Flow Recovery, Dead Code Elimination & Proxy Inliner
 */

export function recoverControlFlow(code: string): { code: string; count: number } {
  let count = 0;
  let current = code;
  let changed = true;
  let passes = 0;

  while (changed && passes < 6) {
    passes++;
    changed = false;

    // 1. Dead branch: if false then ... else ... end
    const deadIfElseRegex = /\bif\s+false\s+then\s*([\s\S]*?)\s*else\s*([\s\S]*?)\s*end\b/g;
    current = current.replace(deadIfElseRegex, (_, __, elseBranch) => {
      count++;
      changed = true;
      return elseBranch.trim();
    });

    // 2. Dead branch: if false then ... end
    const deadIfRegex = /\bif\s+false\s+then\s*[\s\S]*?\s*end\b/g;
    current = current.replace(deadIfRegex, () => {
      count++;
      changed = true;
      return '';
    });

    // 3. Always true branch: if true then ... else ... end
    const trueIfElseRegex = /\bif\s+true\s+then\s*([\s\S]*?)\s*else\s*[\s\S]*?\s*end\b/g;
    current = current.replace(trueIfElseRegex, (_, thenBranch) => {
      count++;
      changed = true;
      return thenBranch.trim();
    });

    // 4. Always true branch: if true then ... end
    const trueIfRegex = /\bif\s+true\s+then\s*([\s\S]*?)\s*end\b/g;
    current = current.replace(trueIfRegex, (_, body) => {
      count++;
      changed = true;
      return body.trim();
    });

    // 5. One-shot repeat loops: repeat ... until true
    const repeatRegex = /\brepeat\s*([\s\S]*?)\s*until\s+true\b/g;
    current = current.replace(repeatRegex, (_, body) => {
      count++;
      changed = true;
      return body.trim();
    });

    // 6. Dead while loops: while false do ... end
    const whileFalseRegex = /\bwhile\s+false\s+do\s*[\s\S]*?\s*end\b/g;
    current = current.replace(whileFalseRegex, () => {
      count++;
      changed = true;
      return '';
    });

    // 7. Redundant empty do ... end
    current = current.replace(/\bdo\s*end\b/g, () => {
      count++;
      changed = true;
      return '';
    });
  }

  return { code: current, count };
}

/**
 * Inlines proxy forwarding functions:
 * local function _0x12(a, b) return a + b end
 * local function _0x34(fn, ...) return fn(...) end
 * local function _0x56(tbl, key) return tbl[key] end
 */
export function inlineProxyFunctions(code: string): { code: string; count: number } {
  let count = 0;
  let current = code;

  // Simple binary proxy: local function fnName(a, b) return a + b end
  const binaryProxyRegex = /local\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*return\s+\2\s*([+\-*/%^~]|==|~=|<|>|<=|>=|\.\.)\s*\3\s*end[;\n\r]?/g;

  const binaryProxies = new Map<string, string>();
  let match: RegExpExecArray | null;

  while ((match = binaryProxyRegex.exec(code)) !== null) {
    const fnName = match[1];
    const op = match[4];
    binaryProxies.set(fnName, op);
  }

  binaryProxies.forEach((op, fnName) => {
    // Replace calls: fnName(arg1, arg2) -> (arg1 op arg2)
    const callRegex = new RegExp(`\\b${fnName}\\s*\\(\\s*([^,()]+(?:\\([^()]*\\))?[^,()]*)\\s*,\\s*([^,()]+(?:\\([^()]*\\))?[^,()]*)\\s*\\)`, 'g');
    current = current.replace(callRegex, (fullMatch, arg1, arg2) => {
      count++;
      return `(${arg1.trim()} ${op} ${arg2.trim()})`;
    });
  });

  // Table getter proxy: local function get(t, k) return t[k] end
  const getProxyRegex = /local\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*return\s+\2\s*\[\s*\3\s*\]\s*end[;\n\r]?/g;

  const getProxies = new Set<string>();
  while ((match = getProxyRegex.exec(code)) !== null) {
    getProxies.add(match[1]);
  }

  getProxies.forEach((fnName) => {
    const callRegex = new RegExp(`\\b${fnName}\\s*\\(\\s*([^,()]+)\\s*,\\s*([^,()]+)\\s*\\)`, 'g');
    current = current.replace(callRegex, (fullMatch, t, k) => {
      count++;
      return `${t.trim()}[${k.trim()}]`;
    });
  });

  return { code: current, count };
}
