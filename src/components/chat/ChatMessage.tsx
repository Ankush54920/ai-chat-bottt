import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  userName?: string;
  timestamp: Date;
}

export const ChatMessage = ({ message, isUser, userName, timestamp }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex w-full animate-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300",
        isUser 
          ? "bg-gradient-to-br from-chat-user/20 to-chat-user/10 border border-chat-user/30 text-chat-user-foreground ml-4" 
          : "bg-gradient-to-br from-chat-ai/20 to-chat-ai/10 border border-chat-ai/30 text-chat-ai-foreground mr-4"
      )}>
        <div className="flex flex-col gap-1">
          {userName && (
            <div className={cn(
              "text-xs font-medium opacity-70",
              isUser ? "text-chat-user" : "text-chat-ai"
            )}>
              {isUser ? userName : "AI Assistant"}
            </div>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </div>
          <div className="text-xs opacity-50 mt-1">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};