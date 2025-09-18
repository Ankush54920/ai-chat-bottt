import { useMemo } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { BookOpen, MessageSquare, Search, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedMessageRendererProps {
  message: string;
  timestamp: Date;
  mode: string;
}

export const EnhancedMessageRenderer = ({ message, timestamp, mode }: EnhancedMessageRendererProps) => {
  // Get mode-specific icon and color
  const getModeInfo = (mode: string) => {
    switch (mode) {
      case "Study Mode":
        return { icon: BookOpen, color: "primary", label: "Study Assistant" };
      case "Debate Mode":
        return { icon: MessageSquare, color: "blue-500", label: "Debate Assistant" };
      case "Research Mode":
        return { icon: Search, color: "green-500", label: "Research Assistant" };
      case "Brainstorming Mode":
        return { icon: Lightbulb, color: "yellow-500", label: "Brainstorming Assistant" };
      default:
        return { icon: MessageSquare, color: "primary", label: "AI Assistant" };
    }
  };

  const modeInfo = getModeInfo(mode);
  const ModeIcon = modeInfo.icon;

  // Enhanced message cleaning and processing
  const processedMessage = useMemo(() => {
    let cleaned = message;
    
    // Step 1: Remove citations and source references
    cleaned = cleaned
      .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
      .replace(/\[[\w\s,.-]+\]/g, '') // Remove [source name] etc.
      .replace(/Source[s]?:\s*.*$/gm, '') // Remove source lines
      .replace(/References?:\s*.*$/gm, '') // Remove reference lines
      .replace(/\*\*Sources?\*\*[\s\S]*$/gm, '') // Remove **Sources** sections
      .replace(/---[\s\S]*Sources?[\s\S]*$/gm, ''); // Remove footer sections
    
    // Step 2: Fix LaTeX formatting
    cleaned = cleaned
      .replace(/\\\\([a-zA-Z]+)/g, '\\$1') // Fix double backslashes
      .replace(/\$\$([^$]+)\$\$/g, (match, content) => {
        const cleanContent = content.trim();
        return `$$${cleanContent}$$`;
      })
      .replace(/\$([^$\n]+)\$/g, (match, content) => {
        const cleanContent = content.trim();
        return `$${cleanContent}$`;
      });
    
    // Step 3: Auto-detect and wrap common math patterns
    cleaned = cleaned
      .replace(/(?<![\$\\])(\d+)\s*\^\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1^{$2}$$')
      .replace(/(?<![\$\\])(\d+)\s*_\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1_{$2}$$')
      .replace(/(?<![\$\\])(sqrt|sin|cos|tan|log|ln)\s*\(/g, '$$\\$1(')
      .replace(/(?<![\$\\])([A-Za-z])\s*=\s*([^.\n]+)(?=\.|\n|$)/g, '$$1 = $2$$');
    
    // Step 4: Clean up whitespace and add paragraph breaks
    cleaned = cleaned
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim();
    
    // Step 5: Add paragraph breaks for better readability
    if (!cleaned.match(/Step\s+\d+/i) && cleaned.length > 200) {
      cleaned = cleaned.replace(/([.:])\s+([A-Z][a-z])/g, '$1\n\n$2');
    }
    
    return cleaned;
  }, [message]);

  // Render math text with KaTeX
  const renderMathText = (text: string) => {
    const displayMathPattern = /\$\$([^$]+?)\$\$/g;
    const inlineMathPattern = /(?<!\$)\$([^$\n]+?)\$(?!\$)/g;
    
    let parts = [];
    let lastIndex = 0;
    
    // Handle display math ($$...$$)
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
    
    // Handle inline math in remaining text parts
    return parts.map((part, partIndex) => {
      if (typeof part === 'string') {
        const inlineParts = [];
        let inlineLastIndex = 0;
        
        part.replace(inlineMathPattern, (match, mathContent, index) => {
          if (index > inlineLastIndex) {
            inlineParts.push(part.substring(inlineLastIndex, index));
          }
          
          try {
            inlineParts.push(
              <span key={`inline-${partIndex}-${index}`} className="katex-inline">
                <InlineMath math={mathContent.trim()} />
              </span>
            );
          } catch (error) {
            console.warn('Inline LaTeX parsing error:', error, 'Content:', mathContent);
            inlineParts.push(
              <span key={`inline-error-${partIndex}-${index}`} className="font-mono text-sm bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded">
                {mathContent.trim()}
              </span>
            );
          }
          
          inlineLastIndex = index + match.length;
          return match;
        });
        
        if (inlineLastIndex < part.length) {
          inlineParts.push(part.substring(inlineLastIndex));
        }
        
        return inlineParts.length > 1 ? inlineParts : part;
      }
      return part;
    }).flat();
  };

  // Parse content into structured sections
  const renderContent = useMemo(() => {
    const lines = processedMessage.split('\n');
    const elements: JSX.Element[] = [];
    let currentStepContent: string[] = [];
    let stepNumber = 0;

    const addContentCard = (content: string[], title?: string, stepNum?: number) => {
      if (content.length === 0) return;
      
      const hasTitle = title || stepNum;
      const hasMath = content.some(line => /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃|∪|∩/i.test(line));
      
      elements.push(
        <div key={`content-${stepNum || elements.length}`} className={cn(
          "rounded-xl p-4 mb-4 transition-all duration-300 animate-in slide-in-from-bottom-2",
          hasTitle 
            ? "bg-gradient-to-br from-muted/30 to-muted/15 border border-border/50 hover:border-primary/30 hover:shadow-lg"
            : "bg-gradient-to-br from-muted/15 to-muted/8 border border-border/30"
        )}>
          {hasTitle && (
            <div className="flex items-center gap-2 mb-3">
              {stepNum && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center border border-primary/30 shadow-sm">
                  <span className="text-sm font-bold text-primary">{stepNum}</span>
                </div>
              )}
              <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                {stepNum && <ModeIcon className="w-4 h-4 text-primary" />}
                <span>{title || `Step ${stepNum}`}</span>
              </h4>
            </div>
          )}
          <div className="space-y-3">
            {content.map((line, idx) => {
              const lineHasMath = /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃|∪|∩/i.test(line);
              
              return (
                <div key={idx} className={cn(
                  "break-words leading-relaxed text-sm sm:text-base",
                  lineHasMath 
                    ? "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 p-3 rounded-lg shadow-sm font-mono" 
                    : "text-muted-foreground py-1"
                )}>
                  <div className="overflow-x-auto min-w-0">
                    {renderMathText(line)}
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
      if (!trimmedLine) return;
      
      // Detect steps for Study and Research modes
      const stepMatch = trimmedLine.match(/^(?:Step\s+(\d+)[:.]?\s*(.*)|\d+\.\s+(.*)|(\d+)\)\s+(.*))$/i);
      
      if (stepMatch && (mode === "Study Mode" || mode === "Research Mode")) {
        // Add previous step if exists
        if (currentStepContent.length > 0) {
          addContentCard(currentStepContent, undefined, stepNumber);
        }
        
        // Start new step
        stepNumber = parseInt(stepMatch[1] || stepMatch[4] || '1');
        const stepContent = stepMatch[2] || stepMatch[3] || stepMatch[5] || '';
        currentStepContent = stepContent ? [stepContent] : [];
      } else if (stepNumber > 0) {
        // Add to current step
        currentStepContent.push(trimmedLine);
      } else {
        // Regular content - add as paragraph
        if (trimmedLine.length > 0) {
          addContentCard([trimmedLine]);
        }
      }
    });

    // Add the last step if exists
    if (currentStepContent.length > 0) {
      addContentCard(currentStepContent, undefined, stepNumber);
    }

    // If no structured content was created, render as paragraphs
    if (elements.length === 0) {
      const paragraphs = processedMessage.split(/\n\s*\n/).filter(p => p.trim());
      
      if (paragraphs.length > 1) {
        paragraphs.forEach((paragraph, pIndex) => {
          addContentCard([paragraph]);
        });
      } else {
        addContentCard([processedMessage]);
      }
    }

    return elements;
  }, [processedMessage, mode, ModeIcon]);

  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[98%] sm:max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] rounded-2xl px-3 sm:px-4 py-4 bg-gradient-to-br from-chat-ai/25 to-chat-ai/10 border border-chat-ai/40 text-chat-ai-foreground mr-2 sm:mr-4 transition-all duration-300 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 text-sm font-semibold opacity-80 text-chat-ai mb-4 border-b border-chat-ai/20 pb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center border border-primary/30 shadow-sm">
            <ModeIcon className="h-3 w-3 text-primary" />
          </div>
          <span>{modeInfo.label}</span>
        </div>
        
        <div className="space-y-3 overflow-hidden min-w-0">
          {renderContent}
        </div>
        
        <div className="text-xs opacity-60 mt-4 pt-3 border-t border-chat-ai/20 flex justify-between items-center">
          <span className="flex items-center gap-1">
            📚 {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] opacity-40 font-mono">{mode.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};