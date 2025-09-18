import { useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { BookOpen, MessageSquare, Search, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanModelOutput } from "@/lib/textProcessor";

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
    return cleanModelOutput(message);
  }, [message]);

  // Render markdown with math support
  const renderMarkdown = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed text-sm sm:text-base text-muted-foreground">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted/30 p-3 rounded-lg overflow-x-auto my-3 border border-border/30">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-sm sm:text-base text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-sm sm:text-base text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
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
      const contentText = content.join('\n\n');
      
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
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(contentText)}
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