/**
 * Text processor utility for cleaning and formatting AI model outputs
 */

/**
 * Cleans Fun Mode output while preserving emojis and ensuring proper list formatting
 * @param raw - Raw text from AI model in Fun Mode
 * @returns Cleaned Markdown string with emojis and proper list formatting
 */
export const cleanFunModeOutput = (raw: string): string => {
  if (!raw) return '';

  let cleaned = raw;

  // Step 1: Convert HTML to proper formatting while preserving emojis
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')  // Convert <p> to paragraphs
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')  // Convert <strong> to bold
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')  // Convert <b> to bold
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')  // Convert <em> to italic
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')  // Convert <i> to italic
    .replace(/<\/?(div|span|section|article)[^>]*>/gi, '');  // Remove other HTML tags

  // Step 2: Ensure numbered lists have proper formatting
  // Convert patterns like "1. 😂 Text" or "1.😂 Text" to "1. 😂 Text\n"
  cleaned = cleaned.replace(/(\d+)\.\s*([^\n]+)/g, (match, num, content) => {
    return `${num}. ${content.trim()}\n`;
  });

  // Step 3: Ensure proper spacing between list items
  // Add blank line between numbered items for better mobile readability
  cleaned = cleaned.replace(/(\n\d+\.\s+[^\n]+\n)(?=\d+\.)/g, '$1\n');

  // Step 4: Clean up excessive whitespace but preserve intentional spacing
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ')  // Normalize spaces on same line
    .replace(/\n{4,}/g, '\n\n\n')  // Max 3 consecutive newlines
    .trim();

  return cleaned;
};

/**
 * Cleans model output by normalizing HTML/Markdown and preserving LaTeX
 * @param raw - Raw text from AI model
 * @returns Cleaned Markdown string safe for react-markdown + rehype-katex
 */
export const cleanModelOutput = (raw: string, preserveEmojis: boolean = false): string => {
  if (!raw) return '';

  let cleaned = raw;

  // Step 1: Convert HTML tags to Markdown equivalents
  cleaned = cleaned
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<div>(.*?)<\/div>/gi, '$1\n')
    .replace(/<\/?(span|section|article)[^>]*>/gi, '');

  // Step 2: Remove citation markers [1], [5], [[source]], etc.
  // Be careful not to remove LaTeX brackets
  cleaned = cleaned
    .replace(/\[\d+\]/g, '') // [1], [2], etc.
    .replace(/\[\[[\w\s,.-]+\]\]/g, '') // [[source name]]
    .replace(/\[[\w\s,.-]+\]/g, (match) => {
      // Preserve LaTeX brackets like \left[ \right]
      if (match.includes('\\')) return match;
      // Preserve array/matrix brackets in LaTeX
      if (cleaned.indexOf('\\begin{') !== -1 || cleaned.indexOf('\\end{') !== -1) return match;
      return '';
    });

  // Step 3: Remove source/reference footers
  cleaned = cleaned
    .replace(/Source[s]?:\s*.*$/gm, '')
    .replace(/References?:\s*.*$/gm, '')
    .replace(/\*\*Sources?\*\*[\s\S]*$/gm, '')
    .replace(/---[\s\S]*Sources?[\s\S]*$/gm, '');

  // Step 4: Fix LaTeX escaping issues
  // Convert double backslashes to single (common escaping issue)
  cleaned = cleaned
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1') // \\frac -> \frac
    .replace(/\\\\([{}()[\]])/g, '\\$1'); // \\{ -> \{

  // Step 5: Normalize LaTeX delimiters
  // Convert \(...\) and \[...\] to $...$ and $$...$$ for better compatibility
  cleaned = cleaned
    .replace(/\\\((.*?)\\\)/g, '$$$1$$')
    .replace(/\\\[(.*?)\\\]/g, '$$$$$$1$$$$');

  // Step 6: Auto-detect and wrap common LaTeX patterns that are missing delimiters
  // Only wrap if not already inside $ delimiters
  const mathPatterns = [
    // Fractions
    { pattern: /(?<![$\\])\\frac\{[^}]+\}\{[^}]+\}/g, wrap: true },
    // Square roots
    { pattern: /(?<![$\\])\\sqrt(?:\[[^\]]+\])?\{[^}]+\}/g, wrap: true },
    // Superscripts and subscripts
    { pattern: /(?<![$\\])[a-zA-Z0-9]\s*\^\s*\{[^}]+\}/g, wrap: true },
    { pattern: /(?<![$\\])[a-zA-Z0-9]\s*_\s*\{[^}]+\}/g, wrap: true },
    // Greek letters
    { pattern: /(?<![$\\])\\(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega)/g, wrap: true },
    // Math functions
    { pattern: /(?<![$\\])\\(sin|cos|tan|log|ln|exp|lim|sum|int|prod)/g, wrap: true },
  ];

  mathPatterns.forEach(({ pattern }) => {
    cleaned = cleaned.replace(pattern, (match) => {
      // Check if already wrapped
      const beforeMatch = cleaned.substring(Math.max(0, cleaned.indexOf(match) - 10), cleaned.indexOf(match));
      if (beforeMatch.includes('$')) return match;
      return `$${match}$`;
    });
  });

  // Step 7: Clean up whitespace
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();

  // Step 8: Add paragraph breaks for better readability
  // Split on double newlines to preserve intentional paragraph breaks
  // Then ensure there's good spacing between sentences
  const paragraphs = cleaned.split(/\n\n+/);
  cleaned = paragraphs
    .map(p => {
      // If paragraph is very long (>300 chars) and has multiple sentences, add breaks
      if (p.length > 300 && p.split(/[.!?]\s+/).length > 3) {
        return p.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
      }
      return p;
    })
    .join('\n\n');

  return cleaned;
};

/**
 * Detects if text contains LaTeX math expressions
 */
export const containsMath = (text: string): boolean => {
  return /\$|\\\w+|\\frac|\\sqrt|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇/.test(text);
};

/**
 * Extract step-by-step content from text
 */
export const extractSteps = (text: string): Array<{ title: string; content: string }> => {
  const steps: Array<{ title: string; content: string }> = [];
  const lines = text.split('\n');
  
  let currentStep: { title: string; content: string } | null = null;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Match step patterns: "Step 1:", "1.", "1)", etc.
    const stepMatch = trimmed.match(/^(?:Step\s+(\d+)[:.]?\s*(.*)|\d+\.\s+(.*)|(\d+)\)\s+(.*))$/i);
    
    if (stepMatch) {
      // Save previous step
      if (currentStep) {
        steps.push(currentStep);
      }
      
      // Start new step
      const stepNum = stepMatch[1] || stepMatch[4] || steps.length + 1;
      const stepContent = stepMatch[2] || stepMatch[3] || stepMatch[5] || '';
      currentStep = {
        title: `Step ${stepNum}`,
        content: stepContent,
      };
    } else if (currentStep) {
      // Add to current step
      currentStep.content += (currentStep.content ? '\n' : '') + trimmed;
    }
  });
  
  // Add last step
  if (currentStep) {
    steps.push(currentStep);
  }
  
  return steps;
};

/**
 * Format text into intro, steps, and summary sections
 */
export interface FormattedContent {
  intro?: string;
  steps: Array<{ title: string; content: string }>;
  summary?: string;
}

export const formatStructuredContent = (text: string): FormattedContent => {
  const cleaned = cleanModelOutput(text);
  const steps = extractSteps(cleaned);
  
  if (steps.length === 0) {
    // No steps detected, return as single content
    return {
      steps: [{ title: '', content: cleaned }],
    };
  }
  
  // Try to extract intro (text before first step)
  const firstStepIndex = text.indexOf(steps[0].title);
  const intro = firstStepIndex > 0 ? text.substring(0, firstStepIndex).trim() : undefined;
  
  return {
    intro,
    steps,
  };
};
