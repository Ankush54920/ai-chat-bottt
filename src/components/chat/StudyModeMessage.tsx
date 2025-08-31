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
  // Remove citations and references from the message
  const cleanMessage = useMemo(() => {
    return message
      .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
      .replace(/\[[\w\s]+\]/g, '') // Remove [word] references
      .replace(/\s+/g, ' ') // Clean up extra spaces
      .trim();
  }, [message]);

  // Parse the message into steps and render with math support
  const renderContent = useMemo(() => {
    const lines = cleanMessage.split('\n');
    const elements: JSX.Element[] = [];
    let currentStepContent: string[] = [];
    let stepNumber = 0;

    const renderMathText = (text: string) => {
      // Handle multiple math patterns: $$...$$ (display), \(...\) (inline), $...$ (inline)
      const displayMathPattern = /\$\$([^$]+)\$\$/g;
      const inlineMathPattern1 = /\\\(([^)]+)\\\)/g;
      const inlineMathPattern2 = /(?<!\$)\$([^$\n]+)\$(?!\$)/g;
      
      let parts = [];
      let lastIndex = 0;
      
      // Handle display math first ($$...$$)
      text.replace(displayMathPattern, (match, mathContent, index) => {
        if (index > lastIndex) {
          parts.push(text.substring(lastIndex, index));
        }
        parts.push(
          <div key={`display-${index}`} className="my-3">
            <BlockMath math={mathContent.trim()} />
          </div>
        );
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
          
          // Handle \(...\) inline math
          workingText = workingText.replace(inlineMathPattern1, (match, mathContent, index) => {
            const beforeText = workingText.substring(inlineLastIndex, index);
            if (beforeText) inlineParts.push(beforeText);
            
            inlineParts.push(
              <span key={`inline1-${partIndex}-${index}`} className="katex-inline">
                <InlineMath math={mathContent.trim()} />
              </span>
            );
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
            finalParts.push(
              <span key={`inline2-${partIndex}-${index}`} className="katex-inline">
                <InlineMath math={mathContent.trim()} />
              </span>
            );
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
        <div key={`step-${stepNum}`} className="study-step-card bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4 mb-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-xs font-bold text-primary">{stepNum}</span>
            </div>
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-1">
              📘 Step {stepNum}
            </h4>
          </div>
          <div className="space-y-3 text-sm leading-relaxed pl-2">
            {content.map((line, idx) => (
              <div key={idx} className="text-muted-foreground break-words">
                {renderMathText(line)}
              </div>
            ))}
          </div>
        </div>
      );
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if this line starts a new step
      const stepMatch = trimmedLine.match(/^Step\s+(\d+)[:.]?\s*(.*)/i);
      
      if (stepMatch) {
        // Add previous step if exists
        if (currentStepContent.length > 0) {
          addStepCard(stepNumber, currentStepContent);
        }
        
        // Start new step
        stepNumber = parseInt(stepMatch[1]);
        currentStepContent = stepMatch[2] ? [stepMatch[2]] : [];
      } else if (trimmedLine && stepNumber > 0) {
        // Add to current step
        currentStepContent.push(trimmedLine);
      } else if (trimmedLine && stepNumber === 0) {
        // Content before any steps - add as regular text
        elements.push(
          <div key={`intro-${index}`} className="text-sm leading-relaxed mb-3 text-muted-foreground p-3 bg-muted/10 rounded-lg border border-border/30 break-words">
            {renderMathText(trimmedLine)}
          </div>
        );
      }
    });

    // Add the last step if exists
    if (currentStepContent.length > 0) {
      addStepCard(stepNumber, currentStepContent);
    }

    // If no steps were found, render the entire message as regular content
    if (elements.length === 0 && stepNumber === 0) {
      elements.push(
        <div key="content" className="text-sm leading-relaxed text-muted-foreground p-4 bg-muted/10 rounded-lg border border-border/30 break-words">
          {renderMathText(cleanMessage)}
        </div>
      );
    }

    return elements;
  }, [cleanMessage]);

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-br from-chat-ai/20 to-chat-ai/10 border border-chat-ai/30 text-chat-ai-foreground mr-4 transition-all duration-300">
        <div className="flex items-center gap-2 text-xs font-medium opacity-70 text-chat-ai mb-3">
          <ArrowRight className="h-3 w-3" />
          Study Mode Assistant
        </div>
        <div className="space-y-3 overflow-hidden">
          {renderContent}
        </div>
        <div className="text-xs opacity-50 mt-3 pt-2 border-t border-chat-ai/20">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};