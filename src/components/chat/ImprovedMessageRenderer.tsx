import { useMemo } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { BookOpen, MessageSquare, Search, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImprovedMessageRendererProps {
  message: string;
  timestamp: Date;
  mode: string;
}

export const ImprovedMessageRenderer = ({ message, timestamp, mode }: ImprovedMessageRendererProps) => {
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

  // Enhanced text processing for smooth, continuous output
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
    
    // Step 2: Fix LaTeX formatting and ensure proper delimiters
    cleaned = cleaned
      .replace(/\\\\([a-zA-Z]+)/g, '\\$1') // Fix double backslashes
      .replace(/\$\$([^$]+?)\$\$/g, (match, content) => {
        const cleanContent = content.trim();
        return `$$${cleanContent}$$`;
      })
      .replace(/\$([^$\n]+?)\$/g, (match, content) => {
        const cleanContent = content.trim();
        return `$${cleanContent}$`;
      });
    
    // Step 3: Auto-detect and wrap common math patterns
    cleaned = cleaned
      .replace(/(?<![\$\\])(\d+)\s*\^\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1^{$2}$$')
      .replace(/(?<![\$\\])(\d+)\s*_\s*(\{[^}]+\}|\w+)(?![^\$]*\$)/g, '$$$1_{$2}$$')
      .replace(/(?<![\$\\])(sqrt|sin|cos|tan|log|ln)\s*\(/g, '$$\\$1(')
      .replace(/(?<![\$\\])([A-Za-z])\s*=\s*([^.\n]+)(?=\.|\n|$)/g, '$$1 = $2$$');
    
    // Step 4: Clean up excessive whitespace and line breaks
    cleaned = cleaned
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
      .replace(/\s+\n/g, '\n') // Remove trailing spaces before newlines
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
    
    // Step 5: Smart paragraph joining for continuous flow
    // Join short lines that are clearly part of the same thought
    cleaned = cleaned.replace(/([.!?])\s*\n\s*([a-z])/g, '$1 $2'); // Join sentences split across lines
    cleaned = cleaned.replace(/([a-z])\s*\n\s*([a-z])/g, '$1 $2'); // Join words split across lines
    cleaned = cleaned.replace(/(\d+)\s*\n\s*([+\-*/=])/g, '$1 $2'); // Join math expressions split across lines
    
    // Step 6: Ensure proper paragraph breaks for readability
    cleaned = cleaned.replace(/([.!?])\s+([A-Z][a-z])/g, '$1\n\n$2'); // Add paragraph breaks after sentences
    cleaned = cleaned.replace(/([.!?])\s+(\d+\.)/g, '$1\n\n$2'); // Add paragraph breaks before numbered lists
    
    return cleaned;
  }, [message]);

  // Enhanced math text renderer with better error handling
  const renderMathText = (text: string) => {
    const displayMathPattern = /\$\$([^$]+?)\$\$/g;
    const inlineMathPattern = /(?<!\$)\$([^$\n]+?)\$(?!\$)/g;
    
    let parts = [];
    let lastIndex = 0;
    
    // Handle display math ($$...$$) with error handling
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

  // Parse content into a single, continuous, well-formatted solution
  const renderContent = useMemo(() => {
    const paragraphs = processedMessage.split(/\n\s*\n/).filter(p => p.trim());
    
    if (paragraphs.length === 0) {
      return <div className="text-muted-foreground">No content to display</div>;
    }

    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => {
          const hasMath = /\$|\\\w+|\^|_|√|∛|∜|∑|∫|∞|±|≤|≥|≠|≈|∆|∂|∇|∈|∉|⊂|⊃|∪|∩/i.test(paragraph);
          const isCalculation = /[\d+\-*/=()^_{}\\]|\\[a-zA-Z]+|\b(sqrt|frac|sum|int|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|sigma|mu|lambda)\b|(\d+\s*[+\-*/=]\s*\d+)|(\d+\s*[<>≤≥]\s*\d+)/i.test(paragraph);
          
          // Detect if this is a step or numbered item
          const isStep = /^(Step\s+\d+|^\d+\.|^\d+\))/i.test(paragraph.trim());
          
          return (
            <div key={index} className={cn(
              "leading-relaxed text-sm sm:text-base",
              isStep && "font-semibold text-foreground mb-2",
              hasMath || isCalculation 
                ? "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 p-4 rounded-lg shadow-sm" 
                : "text-muted-foreground"
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
        })}
      </div>
    );
  }, [processedMessage]);

  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[98%] sm:max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] rounded-2xl px-4 py-5 bg-gradient-to-br from-chat-ai/25 to-chat-ai/10 border border-chat-ai/40 text-chat-ai-foreground mr-2 sm:mr-4 transition-all duration-300 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 text-sm font-semibold opacity-80 text-chat-ai mb-4 border-b border-chat-ai/20 pb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center border border-primary/30 shadow-sm">
            <ModeIcon className="h-3 w-3 text-primary" />
          </div>
          <span>{modeInfo.label}</span>
        </div>
        
        <div className="overflow-hidden min-w-0">
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