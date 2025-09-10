import { useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { BookOpen, MessageSquare, Search, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatForSmoothDisplay, hasMathContent, hasCalculations, isStep } from "@/lib/textProcessor";

interface EnhancedStudyRendererProps {
  message: string;
  timestamp: Date;
  mode: string;
}

export const EnhancedStudyRenderer = ({ message, timestamp, mode }: EnhancedStudyRendererProps) => {
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

  // Process the message for smooth, continuous display
  const processedMessage = useMemo(() => {
    return formatForSmoothDisplay(message);
  }, [message]);

  // Custom components for markdown rendering
  const markdownComponents = {
    // Custom paragraph rendering for better flow
    p: ({ children, ...props }: any) => {
      const text = children?.toString() || '';
      const hasMath = hasMathContent(text);
      const hasCalc = hasCalculations(text);
      const isStepText = isStep(text);
      
      return (
        <p 
          {...props} 
          className={cn(
            "leading-relaxed text-sm sm:text-base mb-4 last:mb-0",
            isStepText && "font-semibold text-foreground",
            (hasMath || hasCalc) && "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 p-4 rounded-lg shadow-sm font-mono text-sm"
          )}
        >
          {children}
        </p>
      );
    },
    
    // Custom list rendering
    ul: ({ children, ...props }: any) => (
      <ul {...props} className="list-disc list-inside space-y-2 mb-4 text-sm sm:text-base leading-relaxed">
        {children}
      </ul>
    ),
    
    ol: ({ children, ...props }: any) => (
      <ol {...props} className="list-decimal list-inside space-y-2 mb-4 text-sm sm:text-base leading-relaxed">
        {children}
      </ol>
    ),
    
    li: ({ children, ...props }: any) => (
      <li {...props} className="text-muted-foreground leading-relaxed">
        {children}
      </li>
    ),
    
    // Custom heading rendering
    h1: ({ children, ...props }: any) => (
      <h1 {...props} className="text-xl font-bold text-foreground mb-4 mt-6 first:mt-0">
        {children}
      </h1>
    ),
    
    h2: ({ children, ...props }: any) => (
      <h2 {...props} className="text-lg font-semibold text-foreground mb-3 mt-5 first:mt-0">
        {children}
      </h2>
    ),
    
    h3: ({ children, ...props }: any) => (
      <h3 {...props} className="text-base font-semibold text-foreground mb-2 mt-4 first:mt-0">
        {children}
      </h3>
    ),
    
    // Custom code rendering
    code: ({ children, className, ...props }: any) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code 
            {...props} 
            className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
          >
            {children}
          </code>
        );
      }
      return (
        <code 
          {...props} 
          className={cn(
            "block bg-muted/50 p-4 rounded-lg text-sm font-mono text-foreground overflow-x-auto",
            className
          )}
        >
          {children}
        </code>
      );
    },
    
    // Custom blockquote rendering
    blockquote: ({ children, ...props }: any) => (
      <blockquote 
        {...props} 
        className="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/20 rounded-r-lg italic text-muted-foreground"
      >
        {children}
      </blockquote>
    ),
    
    // Custom strong/bold rendering
    strong: ({ children, ...props }: any) => (
      <strong {...props} className="font-semibold text-foreground">
        {children}
      </strong>
    ),
    
    // Custom emphasis/italic rendering
    em: ({ children, ...props }: any) => (
      <em {...props} className="italic text-muted-foreground">
        {children}
      </em>
    ),
  };

  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[98%] sm:max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] rounded-2xl px-4 py-5 bg-gradient-to-br from-chat-ai/25 to-chat-ai/10 border border-chat-ai/40 text-chat-ai-foreground mr-2 sm:mr-4 transition-all duration-300 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 text-sm font-semibold opacity-80 text-chat-ai mb-4 border-b border-chat-ai/20 pb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center border border-primary/30 shadow-sm">
            <ModeIcon className="h-3 w-3 text-primary" />
          </div>
          <span>{modeInfo.label}</span>
        </div>
        
        <div className="overflow-hidden min-w-0 prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/30">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {processedMessage}
          </ReactMarkdown>
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