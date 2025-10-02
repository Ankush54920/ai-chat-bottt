import { useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { BookOpen, MessageSquare, Search, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanModelOutput, extractSteps, containsMath } from "@/lib/textProcessor";

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

  // Clean and process the message
  const processedMessage = useMemo(() => {
    return cleanModelOutput(message);
  }, [message]);

  // Extract steps for structured rendering
  const steps = useMemo(() => {
    if (mode === "Study Mode" || mode === "Research Mode") {
      return extractSteps(processedMessage);
    }
    return [];
  }, [processedMessage, mode]);

  // Render content with proper formatting
  const renderContent = useMemo(() => {
    // For Study and Research modes with steps
    if (steps.length > 0 && (mode === "Study Mode" || mode === "Research Mode")) {
      return (
        <div className="space-y-4">
          {steps.map((step, index) => {
            const hasMath = containsMath(step.content);
            
            return (
              <div
                key={index}
                className={cn(
                  "rounded-xl p-4 transition-all duration-300 animate-in slide-in-from-bottom-2",
                  "bg-gradient-to-br from-muted/30 to-muted/15 border border-border/50",
                  "hover:border-primary/30 hover:shadow-lg"
                )}
              >
                {step.title && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center border border-primary/30 shadow-sm">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                      <ModeIcon className="w-4 h-4 text-primary" />
                      <span>{step.title}</span>
                    </h4>
                  </div>
                )}
                <div
                  className={cn(
                    "prose prose-sm max-w-none dark:prose-invert",
                    "prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed",
                    "prose-strong:text-foreground prose-em:text-foreground",
                    "prose-code:text-accent-foreground prose-code:bg-accent/10 prose-code:px-1 prose-code:rounded",
                    "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
                    hasMath && "bg-gradient-to-r from-accent/10 to-accent/5 p-3 rounded-lg border border-accent/20"
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {step.content}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // For other modes or non-structured content
    const hasMath = containsMath(processedMessage);
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none dark:prose-invert",
          "prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed",
          "prose-strong:text-foreground prose-em:text-foreground",
          "prose-code:text-accent-foreground prose-code:bg-accent/10 prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
          "prose-ul:text-muted-foreground prose-ol:text-muted-foreground",
          "prose-li:my-1",
          hasMath && "bg-gradient-to-r from-accent/10 to-accent/5 p-3 rounded-lg border border-accent/20"
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {processedMessage}
        </ReactMarkdown>
      </div>
    );
  }, [processedMessage, mode, ModeIcon, steps]);

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