import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cleanFunModeOutput } from '@/lib/textProcessor';

interface FunModeMessageProps {
  message: string;
  timestamp: Date;
}

export const FunModeMessage = ({ message, timestamp }: FunModeMessageProps) => {
  // Preprocess the message to ensure proper formatting
  const processedMessage = cleanFunModeOutput(message);
  
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 text-foreground mr-2 sm:mr-4 shadow-sm">
        <div className="text-xs font-medium opacity-70 text-accent mb-2">
          AI (Fun Mode) 🎉
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert fun-mode-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom rendering for lists to preserve emojis and formatting
              ol: ({ children }) => (
                <ol className="space-y-3 my-3 list-decimal list-inside pl-1">{children}</ol>
              ),
              ul: ({ children }) => (
                <ul className="space-y-3 my-3 list-disc list-inside pl-1">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed text-sm pl-1 mb-2">{children}</li>
              ),
              p: ({ children }) => (
                <p className="leading-relaxed mb-2 last:mb-0 whitespace-pre-line">{children}</p>
              ),
              // Preserve emojis in all elements
              strong: ({ children }) => (
                <strong className="font-bold text-accent">{children}</strong>
              ),
            }}
          >
            {processedMessage}
          </ReactMarkdown>
        </div>
        <div className="text-xs opacity-50 mt-2">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
