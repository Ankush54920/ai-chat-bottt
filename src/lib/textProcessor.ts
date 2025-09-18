/**
 * Text processing utility for cleaning and normalizing AI model outputs
 */

export function cleanModelOutput(raw: string): string {
  if (!raw) return '';
  
  let cleaned = raw;
  
  // Step 1: Replace HTML tags with Markdown equivalents
  cleaned = cleaned
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    .replace(/<u>(.*?)<\/u>/g, '*$1*')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<div>(.*?)<\/div>/g, '$1\n')
    .replace(/<\/?(h[1-6]|ul|ol|li)>/g, '')
    .replace(/<code>(.*?)<\/code>/g, '`$1`');
  
  // Step 2: Remove citation markers but preserve math brackets
  cleaned = cleaned
    .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
    .replace(/\[\[.*?\]\]/g, '') // Remove [[source]] style
    .replace(/\[[\w\s,.-]+\]/g, (match) => {
      // Keep math-related brackets like [x+1] in equations
      if (/[+\-*/=<>^_{}\\]/.test(match)) return match;
      return '';
    });
  
  // Step 3: Clean up stray markdown markers
  cleaned = cleaned
    .replace(/\*\*\s*\*\*/g, '') // Remove empty bold markers
    .replace(/\*\s*\*/g, '') // Remove empty italic markers
    .replace(/_{2,}/g, '__') // Normalize multiple underscores
    .replace(/\*{3,}/g, '**'); // Normalize multiple asterisks
  
  // Step 4: Normalize whitespace and paragraphs
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/\n\s+/g, '\n') // Remove leading spaces on lines
    .trim();
  
  // Step 5: Ensure LaTeX delimiters are preserved
  cleaned = cleaned
    .replace(/\\\\s*\\\(/g, '\\(') // Fix spaced LaTeX delimiters
    .replace(/\\\\s*\\\)/g, '\\)')
    .replace(/\$\s*\$/g, '$$'); // Fix spaced dollar delimiters
  
  return cleaned;
}

/**
 * Extract and clean LaTeX expressions from text
 */
export function extractLatex(text: string): { text: string; latex: string[] } {
  const latexPatterns = [
    /\$\$(.*?)\$\$/g, // Block math
    /\\\[(.*?)\\\]/g, // Block math alternative
    /\\\((.*?)\\\)/g, // Inline math
    /\$([^\$\n]+?)\$/g // Inline math with dollars
  ];
  
  const latex: string[] = [];
  let cleanText = text;
  
  latexPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, (match, content) => {
      latex.push(content.trim());
      return match; // Keep the delimiters for rendering
    });
  });
  
  return { text: cleanText, latex };
}

/**
 * Auto-detect and wrap common math patterns in LaTeX delimiters
 */
export function autoWrapMath(text: string): string {
  return text
    // Wrap fractions: a/b -> \frac{a}{b} (only simple cases)
    .replace(/\b(\w+)\/(\w+)\b/g, (match, num, den) => {
      if (/^\d+$/.test(num) && /^\d+$/.test(den)) {
        return `$\\\frac{${num}}{${den}}$`;
      }
      return match;
    })
    // Wrap square roots: sqrt(x) -> \sqrt{x}
    .replace(/sqrt\(([^)]+)\)/g, '$\\sqrt{$1}$')
    // Wrap superscripts: x^2 -> x^{2}
    .replace(/([a-zA-Z0-9])\^([a-zA-Z0-9]+)/g, '$1^{$2}')
    // Wrap subscripts: x_1 -> x_{1}
    .replace(/([a-zA-Z0-9])_([a-zA-Z0-9]+)/g, '$1_{$2}');
}

/**
 * Test function for validation
 */
export function testCleanModelOutput() {
  const testCases = [
    '<strong>Bold text</strong>',
    '**Already bold**',
    '\\frac{1}{2}',
    '[5] citation',
    '<p>Paragraph</p><br>Line break',
    '$$x = \\frac{a}{b}$$'
  ];
  
  testCases.forEach(test => {
    console.log(`Input: "${test}"`);
    console.log(`Output: "${cleanModelOutput(test)}"`);
    console.log('---');
  });
}
