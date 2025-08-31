import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIMode } from "./AISelector";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  selectedMode: AIMode;
  onInsertText: (text: string) => void;
  onMiniGameSelect?: (game: string) => void;
}

export const ChatInput = ({ onSendMessage, isLoading, disabled, selectedMode, onInsertText, onMiniGameSelect }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const quickActions = {
    "Study Mode": [
      "Solve step by step",
      "Explain like I'm 10", 
      "Give a quick summary"
    ],
    "Research Mode": [
      "Give me an overview",
      "List important facts/data",
      "Compare different viewpoints"
    ],
    "Creative Mode": [
      "Give me creative ideas",
      "Write me a short story/poem",
      "Describe this like a movie scene"
    ],
    "Fun Mode": [
      "🎯 Tell me a joke",
      "🧠 Ask me a riddle",
      "🎲 Play a mini-game",
      "💬 Compliment me",
      "😜 Tell me a fun fact"
    ],
    "Debate Mode": [
      "Break this down logically",
      "List pros & cons",
      "Give alternative perspectives"
    ]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === "🎲 Play a mini-game") {
      onMiniGameSelect?.("");
      return;
    }
    
    // Clean up the action text (remove emojis for cleaner input)
    const cleanAction = action.replace(/^[🎯🧠🎲💬😜]\s*/, "");
    setMessage(cleanAction);
    onInsertText(cleanAction);
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border-t border-border/50">
      {/* Quick Actions */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-1 justify-center flex-wrap">
          {quickActions[selectedMode]?.slice(0, selectedMode === "Fun Mode" ? 5 : 3).map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading || disabled}
              className={cn(
                "text-xs bg-muted/30 border-border/40 hover:bg-muted/60",
                "hover:border-primary/40 transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                selectedMode === "Fun Mode" && "text-[10px] px-2 py-1"
              )}
            >
              {action}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 pt-0">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading || disabled}
          className={cn(
            "flex-1 bg-muted/50 border-border/50 focus:border-primary/50 transition-all duration-300",
            "placeholder:text-muted-foreground/50"
          )}
        />
        <Button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className={cn(
            "bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80",
            "shadow-lg hover:shadow-primary/25 transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};