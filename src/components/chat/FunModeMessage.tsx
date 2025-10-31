import { useMemo } from 'react';
import { cleanFunModeOutput } from '@/lib/textProcessor';

interface FunModeMessageProps {
  message: string;
  timestamp: Date;
}

// Convert markdown to HTML while preserving emojis
const markdownToHtml = (text: string): string => {
  return text
    // Bold text: **text** → <strong>text</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic text: *text* → <em>text</em>
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Line breaks: \n → <br>
    .replace(/\n/g, '<br>')
    // Preserve emojis (no changes needed - they're already UTF-8)
    ;
};

export const FunModeMessage = ({ message, timestamp }: FunModeMessageProps) => {
  // Process the message once using useMemo to avoid re-processing on every render
  const processedHtml = useMemo(() => {
    // Only clean if message contains HTML tags (fresh AI responses)
    // Stored messages with emojis should skip cleaning to prevent corruption
    const hasHtmlTags = /<\w+>|<\/\w+>/.test(message);
    const cleaned = hasHtmlTags ? cleanFunModeOutput(message) : message;
    return markdownToHtml(cleaned);
  }, [message]);
  
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 text-foreground mr-2 sm:mr-4 shadow-sm">
        <div className="text-xs font-medium opacity-70 text-accent mb-2">
          AI (Fun Mode) 🎉
        </div>
        {/* Direct HTML rendering with emoji-safe styling */}
        <div 
          className="prose prose-sm max-w-none dark:prose-invert fun-mode-content"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
        <div className="text-xs opacity-50 mt-2">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
