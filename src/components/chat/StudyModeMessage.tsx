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
      // First handle display math ($$...$$)
      const displayMathPattern = /\$\$([^$]+)\$\$/g;
      const inlineMathPattern = /\\\(([^)]+)\\\)/g;
      
      let parts = [];
      let lastIndex = 0;
      
      // Handle display math
      text.replace(displayMathPattern, (match, mathContent, index) => {
        if (index > lastIndex) {
          parts.push(text.substring(lastIndex, index));
        }
        parts.push(<BlockMath key={`display-${index}`} math={mathContent.trim()} />);
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
          
          part.replace(inlineMathPattern, (match, mathContent, index) => {
            if (index > inlineLastIndex) {
              inlineParts.push(part.substring(inlineLastIndex, index));
            }
            inlineParts.push(<InlineMath key={`inline-${partIndex}-${index}`} math={mathContent.trim()} />);
            inlineLastIndex = index + match.length;
            return match;
          });
          
          if (inlineLastIndex < part.length) {
            inlineParts.push(part.substring(inlineLastIndex));
          }
          
          return inlineParts;
        }
        return part;
      }).flat();
    };

    const addStepCard = (stepNum: number, content: string[]) => {
      if (content.length === 0) return;
      
      elements.push(
        <div key={`step-${stepNum}`} className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <BookOpen className="h-3 w-3 text-primary" />
            </div>
            <h4 className="font-semibold text-sm text-foreground">Step {stepNum}</h4>
          </div>
          <div className="space-y-2 text-sm leading-relaxed">
            {content.map((line, idx) => (
              <div key={idx} className="text-muted-foreground">
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
          <div key={`intro-${index}`} className="text-sm leading-relaxed mb-3 text-muted-foreground">
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
        <div key="content" className="text-sm leading-relaxed text-muted-foreground">
          {renderMathText(cleanMessage)}
        </div>
      );
    }

    return elements;
  }, [cleanMessage]);

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-br from-chat-ai/20 to-chat-ai/10 border border-chat-ai/30 text-chat-ai-foreground mr-4">
        <div className="flex items-center gap-2 text-xs font-medium opacity-70 text-chat-ai mb-3">
          <ArrowRight className="h-3 w-3" />
          Study Mode Assistant
        </div>
        <div className="space-y-2">
          {renderContent}
        </div>
        <div className="text-xs opacity-50 mt-3 pt-2 border-t border-chat-ai/20">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};