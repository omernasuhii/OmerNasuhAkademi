/**
 * Soru çözüm asistanı ve AI yanıtlarındaki LaTeX / dolar işaretlerini ($) temizleyip
 * anlaşılır Türkçe matematik ve standart parantez (...) formatına dönüştürür.
 */
export function cleanMathText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // 1. LaTeX math blocks $$...$$ -> strip $$ and format nicely
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, (_match, p1) => {
    return `\n\n${p1.trim()}\n\n`;
  });

  // 2. LaTeX fractions: \frac{a}{b} -> (a) / (b)
  cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)');

  // 3. LaTeX square roots: \sqrt{a} -> √(a)
  cleaned = cleaned.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // 4. Common LaTeX symbols to clean readable Unicode
  cleaned = cleaned
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\le(?![a-zA-Z])/g, '≤')
    .replace(/\\ge(?![a-zA-Z])/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\degree/g, '°')
    .replace(/\^\\circ/g, '°')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\\{/g, '{')
    .replace(/\\right\\}/g, '}');

  // 5. LaTeX text wrappers: \text{...}, \mathrm{...}
  cleaned = cleaned.replace(/\\(text|mathrm|mathbf|mathit)\{([^}]+)\}/g, '$2');

  // 6. Handle $(...) or ($...) or $(...)$ -> (...)
  cleaned = cleaned.replace(/\$\s*\(([^)]+)\)\s*\$/g, '($1)');
  cleaned = cleaned.replace(/\$\s*\(([^)]+)\)/g, '($1)');
  cleaned = cleaned.replace(/\(\s*\$([^)]+)\)/g, '($1)');

  // 7. Inline math $...$ -> extract inner text without $
  cleaned = cleaned.replace(/\$([^\$\n]+?)\$/g, (_match, p1) => {
    return p1.trim();
  });

  // 8. Remove any remaining stray $ signs next to chars, parentheses, brackets
  cleaned = cleaned.replace(/\$([a-zA-Z0-9\(\)\[\]\{\}\+\-\*\/\=\<\>\_\^])/g, '$1');
  cleaned = cleaned.replace(/([a-zA-Z0-9\(\)\[\]\{\}\+\-\*\/\=\<\>\_\^])\$/g, '$1');
  cleaned = cleaned.replace(/\$\s+/g, '');
  cleaned = cleaned.replace(/\s+\$/g, '');
  cleaned = cleaned.replace(/^\$|\$$/gm, '');

  return cleaned;
}
