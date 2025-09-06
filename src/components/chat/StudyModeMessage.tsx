import { useMemo } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyModeMessageProps {
  message: string;
  timestamp: Date;
}

export const StudyModeMessage = ({ message, timestamp }: StudyModeMessageProps) => {
  // Enhanced message cleaning and LaTeX normalization
  const cleanMessage = useMemo(() => {
    let cleaned = message;
    
    // Step 1: Additional citation cleanup (backend should have done most of this)
    cleaned = cleaned
      .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
      .replace(/\[[\w\s,.-]+\]/g, '') // Remove [source name] etc.
      .replace(/Source[s]?:\s*.*$/gm, '') // Remove any remaining source lines
      .replace(/References?:\s*.*$/gm, ''); // Remove any remaining reference lines
    
    // Step 2: Convert HTML tags back to plain formatting for React rendering
    cleaned = cleaned
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**') // Convert HTML bold back to markdown
      .replace(/<em>(.*?)<\/em>/g, '*$1*'); // Convert HTML italic back to markdown
    
    // Step 3: Ensure proper LaTeX delimiters
    cleaned = cleaned
      .replace(/\$\$([^$]+)\$\$/g, (match, content) => {
        // Clean the content and ensure it's valid LaTeX
        const cleanContent = content.trim();
        return `$$${cleanContent}$$`;
      })
      .replace(/\$([^$\n]+)\$/g, (match, content) => {
        // Clean inline math content
        const cleanContent = content.trim();
        return `$${cleanContent}$`;
      });
    
    // Step 4: Auto-detect common math patterns that might not be wrapped
    cleaned = cleaned
      .replace(/(?<![\$\\])(\d+)\s*\^\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1^{$2}$$') // Exponents
      .replace(/(?<![\$\\])(\d+)\s*_\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1_{$2}$$') // Subscripts  
      .replace(/(?<![\$\\])(sqrt|sin|cos|tan|log|ln)\s*\(/g, '$$\\$1(') // Functions
      .replace(/(?<![\$\\])([A-Za-z])\s*=\s*([^.\n]+)(?=\.|\n|$)/g, '$$1 = $2$$'); // Equations
    
    // Step 5: Clean up whitespace
    return cleaned
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim();
  }, [message]);

  // Parse the message into steps and render with math support
  const renderContent = useMemo(() => {
    const lines = cleanMessage.split('\n');
    const elements: JSX.Element[] = [];
    let currentStepContent: string[] = [];
    let stepNumber = 0;

    const renderMathText = (text: string) => {
      // Enhanced math pattern detection with error handling
      const displayMathPattern = /\$\$([^$]+?)\$\$/g;
      const inlineMathPattern1 = /\\\(([^)]+?)\\\)/g;
      const inlineMathPattern2 = /(?<!\$)\$([^$\n]+?)\$(?!\$)/g;
      
      // Detect if this text contains calculations (numbers, operators, LaTeX functions)
      const isCalculation = /[\d+\-*/=()^_{}\\]|\\[a-zA-Z]+|\b(sqrt|frac|sum|int|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|sigma|mu|lambda)\b|[√∛∜∑∫∞±≤≥≠≈∆∂∇∈∉⊂⊃∪∩]/i.test(text);
      
      let parts = [];
      let lastIndex = 0;
      
      // Handle display math first ($$...$$) with error handling
      text.replace(displayMathPattern, (match, mathContent, index) => {
        if (index > lastIndex) {
          parts.push(text.substring(lastIndex, index));
        }
        
        try {
          const cleanMathContent = mathContent.trim();
          parts.push(
            <div key={`display-${index}`} className="my-4 overflow-x-auto">
              <div className="flex justify-center min-w-0">
                <div className="max-w-full overflow-x-auto">
                  <BlockMath math={cleanMathContent} />
                </div>
              </div>
            </div>
          );
        } catch (error) {
          // Fallback to plain text if LaTeX parsing fails
          console.warn('LaTeX parsing error:', error, 'Content:', mathContent);
          parts.push(
            <div key={`display-error-${index}`} className="my-2 text-center font-mono text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400">
              {mathContent.trim()}
            </div>
          );
        }
        
        lastIndex = index + match.length;
        return match;
      });
      
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      // Now handle inline math in the remaining text parts
      return parts.map((part, partIndex) => {
        if (typeof part === 'string') {
          const inlineParts = [];
          let inlineLastIndex = 0;
          let workingText = part;
          
          // Handle \(...\) inline math with error handling
          workingText = workingText.replace(inlineMathPattern1, (match, mathContent, index) => {
            const beforeText = workingText.substring(inlineLastIndex, index);
            if (beforeText) inlineParts.push(beforeText);
            
            try {
              inlineParts.push(
                <span key={`inline1-${partIndex}-${index}`} className="katex-inline">
                  <InlineMath math={mathContent.trim()} />
                </span>
              );
            } catch (error) {
              console.warn('Inline LaTeX parsing error:', error, 'Content:', mathContent);
              inlineParts.push(
                <span key={`inline1-error-${partIndex}-${index}`} className="font-mono text-sm bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded">
                  {mathContent.trim()}
                </span>
              );
            }
            
            inlineLastIndex = index + match.length;
            return '';
          });
          
          // Reset for $...$ pattern
          let currentText = inlineLastIndex < part.length ? part.substring(inlineLastIndex) : '';
          let finalParts = [];
          let finalIndex = 0;
          
          currentText.replace(inlineMathPattern2, (match, mathContent, index) => {
            if (index > finalIndex) {
              finalParts.push(currentText.substring(finalIndex, index));
            }
            
            try {
              finalParts.push(
                <span key={`inline2-${partIndex}-${index}`} className="katex-inline">
                  <InlineMath math={mathContent.trim()} />
                </span>
              );
            } catch (error) {
              console.warn('Inline LaTeX parsing error:', error, 'Content:', mathContent);
              finalParts.push(
                <span key={`inline2-error-${partIndex}-${index}`} className="font-mono text-sm bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded">
                  {mathContent.trim()}
                </span>
              );
            }
            
            finalIndex = index + match.length;
            return match;
          });
          
          if (finalIndex < currentText.length) {
            finalParts.push(currentText.substring(finalIndex));
          }
          
          return [...inlineParts, ...finalParts].filter(p => p);
        }
        return part;
      }).flat();
    };

    const addStepCard = (stepNum: number, content: string[]) => {
      if (content.length === 0) return;
      
      elements.push(
        <div key={`step-${stepNum}`} className="study-step-card bg-gradient-to-br from-muted/30 to-muted/15 border border-border/50 rounded-xl p-3 sm:p-4 mb-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center border border-primary/30 flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-primary">{stepNum}</span>
            </div>
            <h4 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Step {stepNum}</span>
            </h4>
          </div>
          <div className="space-y-3 text-sm sm:text-base leading-relaxed">
            {content.map((line, idx) => {
              // Enhanced calculation and math detection
              const hasMath = /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃|∪|∩|α|β|γ|δ|ε|θ|λ|μ|π|σ|φ|ψ|ω/i.test(line);
              const isCalculation = /[\d+\-*/=()^_{}\\]|\\[a-zA-Z]+|\b(sqrt|frac|sum|int|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|sigma|mu|lambda)\b|(\d+\s*[+\-*/=]\s*\d+)|(\d+\s*[<>≤≥]\s*\d+)/i.test(line);
              
              return (
                <div key={idx} className={cn(
                  "break-words transition-all duration-200 rounded-lg",
                  (hasMath || isCalculation)
                    ? "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 p-3 shadow-sm" 
                    : "text-muted-foreground leading-relaxed py-1"
                )}>
                  <div className="overflow-x-auto min-w-0">
                    <div className={cn(
                      "break-words",
                      (hasMath || isCalculation) && "font-mono text-sm"
                    )}>
                      {renderMathText(line)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty lines
      
      // Enhanced step detection - handle various formats
      const stepMatch = trimmedLine.match(/^(?:Step\s+(\d+)[:.]?\s*(.*)|\d+\.\s+(.*)|(\d+)\)\s+(.*))$/i);
      
      if (stepMatch) {
        // Add previous step if exists
        if (currentStepContent.length > 0) {
          addStepCard(stepNumber, currentStepContent);
        }
        
        // Start new step - handle different match groups
        stepNumber = parseInt(stepMatch[1] || stepMatch[4] || '1');
        const stepContent = stepMatch[2] || stepMatch[3] || stepMatch[5] || '';
        currentStepContent = stepContent ? [stepContent] : [];
      } else if (stepNumber > 0) {
        // Add to current step (we're already in a step)
        currentStepContent.push(trimmedLine);
      } else {
        // Content before any steps - render as introduction
        const hasMath = /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃∪|∩|α|β|γ|δ|ε|θ|λ|μ|π|σ|φ|ψ|ω/i.test(trimmedLine);
        const isCalculation = /[\d+\-*/=()^_{}\\]|\\[a-zA-Z]+|\b(sqrt|frac|sum|int|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|sigma|mu|lambda)\b|(\d+\s*[+\-*/=]\s*\d+)|(\d+\s*[<>≤≥]\s*\d+)/i.test(trimmedLine);
        
        elements.push(
          <div key={`intro-${index}`} className={cn(
            "text-sm sm:text-base leading-relaxed mb-4 p-4 rounded-lg border break-words transition-all duration-300 animate-in fade-in-50",
            (hasMath || isCalculation)
              ? "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 shadow-sm" 
              : "text-muted-foreground bg-muted/8 border-border/20"
          )}>
            <div className="overflow-x-auto min-w-0">
              <div className={cn(
                "break-words",
                (hasMath || isCalculation) && "font-mono text-sm"
              )}>
                {renderMathText(trimmedLine)}
              </div>
            </div>
          </div>
        );
      }
    });

    // Add the last step if exists
    if (currentStepContent.length > 0) {
      addStepCard(stepNumber, currentStepContent);
    }

    // If no steps were found, render the entire message as regular content with paragraph breaks
    if (elements.length === 0 && stepNumber === 0) {
      // Split into paragraphs for better readability
      const paragraphs = cleanMessage.split(/\n\s*\n/).filter(p => p.trim());
      
      if (paragraphs.length > 1) {
        // Multiple paragraphs - render each separately
        paragraphs.forEach((paragraph, pIndex) => {
          const hasMath = /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃|∪|∩|α|β|γ|δ|ε|θ|λ|μ|π|σ|φ|ψ|ω/i.test(paragraph);
          const isCalculation = /[\d+\-*/=()^_{}\\]|\\[a-zA-Z]+|\b(sqrt|frac|sum|int|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|sigma|mu|lambda)\b|(\d+\s*[+\-*/=]\s*\d+)|(\d+\s*[<>≤≥]\s*\d+)/i.test(paragraph);
          
          elements.push(
            <div key={`paragraph-${pIndex}`} className={cn(
              "text-sm sm:text-base leading-relaxed mb-3 p-3 sm:p-4 rounded-lg border break-words transition-all duration-300 animate-in fade-in-50",
              (hasMath || isCalculation)
                ? "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 shadow-sm" 
                : "text-muted-foreground bg-muted/8 border-border/20"
            )}>
              <div className="overflow-x-auto min-w-0">
                <div className={cn(
                  "break-words",
                  (hasMath || isCalculation) && "font-mono text-sm"
                )}>
                  {renderMathText(paragraph)}
                </div>
              </div>
            </div>
          );
        });
      } else {
        // Single paragraph
        const hasMath = /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃|∪|∩|α|β|γ|δ|ε|θ|λ|μ|π|σ|φ|ψ|ω/i.test(cleanMessage);
        const isCalculation = /[\d+\-*/=()^_{}\\]|\\[a-zA-Z]+|\b(sqrt|frac|sum|int|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|sigma|mu|lambda)\b|(\d+\s*[+\-*/=]\s*\d+)|(\d+\s*[<>≤≥]\s*\d+)/i.test(cleanMessage);
        
        elements.push(
          <div key="content" className={cn(
            "text-sm sm:text-base leading-relaxed p-4 rounded-lg border break-words transition-all duration-300 animate-in fade-in-50",
            (hasMath || isCalculation)
              ? "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 shadow-sm" 
              : "text-muted-foreground bg-muted/8 border-border/20"
          )}>
            <div className="overflow-x-auto min-w-0">
              <div className={cn(
                "break-words",
                (hasMath || isCalculation) && "font-mono text-sm"
              )}>
                {renderMathText(cleanMessage)}
              </div>
            </div>
          </div>
        );
      }
    }

    return elements;
  }, [cleanMessage]);

  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[98%] sm:max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] rounded-2xl px-3 sm:px-4 py-4 bg-gradient-to-br from-chat-ai/25 to-chat-ai/10 border border-chat-ai/40 text-chat-ai-foreground mr-2 sm:mr-4 transition-all duration-300 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 text-sm font-semibold opacity-80 text-chat-ai mb-4 border-b border-chat-ai/20 pb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center border border-primary/30 shadow-sm">
            <BookOpen className="h-3 w-3 text-primary" />
          </div>
          <span>Study Mode Assistant</span>
        </div>
        
        <div className="space-y-3 overflow-hidden min-w-0">
          {renderContent}
        </div>
        
        <div className="text-xs opacity-60 mt-4 pt-3 border-t border-chat-ai/20 flex justify-between items-center">
          <span className="flex items-center gap-1">
            📚 {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] opacity-40 font-mono">MATH</span>
        </div>
      </div>
    </div>
  );
};