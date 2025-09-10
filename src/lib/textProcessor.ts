/**
 * Text processing utilities for cleaning and formatting AI responses
 * Creates smooth, continuous, well-formatted solutions
 */

export interface TextProcessingOptions {
  removeCitations?: boolean;
  fixLaTeX?: boolean;
  joinShortLines?: boolean;
  addParagraphBreaks?: boolean;
  normalizeWhitespace?: boolean;
}

export const defaultTextProcessingOptions: TextProcessingOptions = {
  removeCitations: true,
  fixLaTeX: true,
  joinShortLines: true,
  addParagraphBreaks: true,
  normalizeWhitespace: true,
};

/**
 * Main text processing function that cleans and formats AI responses
 * for smooth, continuous display like ChatGPT
 */
export function processAIText(
  text: string, 
  options: TextProcessingOptions = defaultTextProcessingOptions
): string {
  let processed = text;

  // Step 1: Remove citations and source references
  if (options.removeCitations) {
    processed = processed
      .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
      .replace(/\[[\w\s,.-]+\]/g, '') // Remove [source name] etc.
      .replace(/Source[s]?:\s*.*$/gm, '') // Remove source lines
      .replace(/References?:\s*.*$/gm, '') // Remove reference lines
      .replace(/\*\*Sources?\*\*[\s\S]*$/gm, '') // Remove **Sources** sections
      .replace(/---[\s\S]*Sources?[\s\S]*$/gm, ''); // Remove footer sections
  }

  // Step 2: Fix LaTeX formatting and ensure proper delimiters
  if (options.fixLaTeX) {
    processed = processed
      .replace(/\\\\([a-zA-Z]+)/g, '\\$1') // Fix double backslashes
      .replace(/\$\$([^$]+?)\$\$/g, (match, content) => {
        const cleanContent = content.trim();
        return `$$${cleanContent}$$`;
      })
      .replace(/\$([^$\n]+?)\$/g, (match, content) => {
        const cleanContent = content.trim();
        return `$${cleanContent}$`;
      })
      // Auto-detect and wrap common math patterns
      .replace(/(?<![\$\\])(\d+)\s*\^\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1^{$2}$$')
      .replace(/(?<![\$\\])(\d+)\s*_\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1_{$2}$$')
      .replace(/(?<![\$\\])(sqrt|sin|cos|tan|log|ln)\s*\(/g, '$$\\$1(')
      .replace(/(?<![\$\\])([A-Za-z])\s*=\s*([^.\n]+)(?=\.|\n|$)/g, '$$1 = $2$$');
  }

  // Step 3: Normalize whitespace
  if (options.normalizeWhitespace) {
    processed = processed
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
      .replace(/\s+\n/g, '\n') // Remove trailing spaces before newlines
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
  }

  // Step 4: Join short lines for continuous flow
  if (options.joinShortLines) {
    processed = processed
      .replace(/([.!?])\s*\n\s*([a-z])/g, '$1 $2') // Join sentences split across lines
      .replace(/([a-z])\s*\n\s*([a-z])/g, '$1 $2') // Join words split across lines
      .replace(/(\d+)\s*\n\s*([+\-*/=])/g, '$1 $2') // Join math expressions split across lines
      .replace(/([a-z])\s*\n\s*([A-Z][a-z])/g, '$1 $2') // Join words to capitalized words
      .replace(/([a-z])\s*\n\s*(\d)/g, '$1 $2'); // Join words to numbers
  }

  // Step 5: Add proper paragraph breaks for readability
  if (options.addParagraphBreaks) {
    processed = processed
      .replace(/([.!?])\s+([A-Z][a-z])/g, '$1\n\n$2') // Add paragraph breaks after sentences
      .replace(/([.!?])\s+(\d+\.)/g, '$1\n\n$2') // Add paragraph breaks before numbered lists
      .replace(/([.!?])\s+(Step\s+\d+)/gi, '$1\n\n$2') // Add paragraph breaks before steps
      .replace(/([.!?])\s+(First|Second|Third|Next|Finally|Therefore|Thus|Hence)/gi, '$1\n\n$2'); // Add paragraph breaks before transition words
  }

  return processed;
}

/**
 * Detect if text contains mathematical content
 */
export function hasMathContent(text: string): boolean {
  return /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃|∪|∩|α|β|γ|δ|ε|θ|λ|μ|π|σ|φ|ψ|ω/i.test(text);
}

/**
 * Detect if text contains calculations
 */
export function hasCalculations(text: string): boolean {
  return /[\d+\-*/=()^_{}\\]|\\[a-zA-Z]+|\b(sqrt|frac|sum|int|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|sigma|mu|lambda)\b|(\d+\s*[+\-*/=]\s*\d+)|(\d+\s*[<>≤≥]\s*\d+)/i.test(text);
}

/**
 * Detect if text is a step or numbered item
 */
export function isStep(text: string): boolean {
  return /^(Step\s+\d+|^\d+\.|^\d+\))/i.test(text.trim());
}

/**
 * Split text into meaningful paragraphs
 */
export function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter(p => p.trim());
}

/**
 * Format text for smooth, continuous display
 * This is the main function to use for Study Mode and other modes
 */
export function formatForSmoothDisplay(text: string): string {
  return processAIText(text, {
    removeCitations: true,
    fixLaTeX: true,
    joinShortLines: true,
    addParagraphBreaks: true,
    normalizeWhitespace: true,
  });
}