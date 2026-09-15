/**
 * Luau / Lua Code Beautifier & Formatter
 */

export interface FormatOptions {
  indentStyle: '2spaces' | '4spaces' | 'tabs';
  simplifyLuauTypes: boolean;
}

export function formatLuauCode(code: string, options: FormatOptions): string {
  const indentUnit =
    options.indentStyle === 'tabs' ? '\t' : options.indentStyle === '4spaces' ? '    ' : '  ';

  let current = code;

  // 1. Simplify Luau type annotations if requested (e.g., `local x: any = 5` -> `local x = 5`, `val :: any` -> `val`)
  if (options.simplifyLuauTypes) {
    // Remove inline type assertions: val :: any
    current = current.replace(/\s*::\s*[a-zA-Z_][a-zA-Z0-9_.<>, ]*/g, '');
  }

  // 2. Separate statements stuck on single lines with semicolons
  current = current.replace(/;(?=\s*[a-zA-Z_])/g, ';\n');

  // Split lines
  const rawLines = current.split(/\r?\n/);
  const formattedLines: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();

    // Ignore completely empty lines if previous line was also empty
    if (!line) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    // Preserve comments
    if (line.startsWith('--')) {
      formattedLines.push(indentUnit.repeat(indentLevel) + line);
      continue;
    }

    // Check for closing keywords at the start of line: end, until, else, elseif, }
    const startsWithClosing = /^(end\b|until\b|else\b|elseif\b|\}|\])/.test(line);
    if (startsWithClosing) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Format spaces around operators (when outside quotes)
    line = formatOperators(line);

    // Add current line with proper indentation
    formattedLines.push(indentUnit.repeat(indentLevel) + line);

    // Check if line re-opens block (like else, elseif)
    if (/^(else\b|elseif\b)/.test(line)) {
      indentLevel++;
    } else {
      // Calculate delta indent for opening constructs
      const openMatches = countOccurrences(
        line,
        /\b(function\b(?!\s*end)|then\b|do\b|repeat\b|\{)\b/g
      );
      const closeMatches = countOccurrences(
        line,
        /\b(end\b|until\b|\})\b/g
      );

      // If the line opened and closed on the same line, no net indent change
      // Only increase if not already accounted for by closing start
      const delta = openMatches - closeMatches;
      if (delta > 0 && !startsWithClosing) {
        indentLevel += delta;
      }
    }
  }

  return formattedLines.join('\n').trim();
}

/**
 * Counts regex occurrences in line
 */
function countOccurrences(str: string, regex: RegExp): number {
  const matches = str.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Cleans spaces around commas, colons, assignments
 */
function formatOperators(line: string): string {
  // If line contains quotes, be careful not to touch inside strings
  const stringTokens: string[] = [];
  const masked = line.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    stringTokens.push(match);
    return `___S_${stringTokens.length - 1}___`;
  });

  let formatted = masked;

  // Add space after commas
  formatted = formatted.replace(/,([^\s])/g, ', $1');

  // Spaces around assignment = (not ==, <=, >=, ~=)
  formatted = formatted.replace(/([^=<>~!+\-*/%])\s*=\s*([^=])/g, '$1 = $2');

  // Spaces around concatenation ..
  formatted = formatted.replace(/\s*\.\.\s*/g, ' .. ');

  // Spaces around comparison operators
  formatted = formatted.replace(/\s*(==|~=|<=|>=)\s*/g, ' $1 ');

  // Restore string literals
  stringTokens.forEach((str, idx) => {
    formatted = formatted.replace(`___S_${idx}___`, () => str);
  });

  return formatted;
}
