import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { UserNameDialog } from "./UserNameDialog";
import { AISelector, AIMode } from "./AISelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle } from "lucide-react";

interface Conversation {
  id: string;
  user_name: string;
  ai_used: string;
  prompt: string;
  reply: string;
  inputtokencount: number;
  outputtokencount: number;
  totaltokencount: number;
  created_at: string;
}

export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<AIMode>("Study Mode");
  const [isLoading, setIsLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  // Load existing conversations
  useEffect(() => {
    if (userName) {
      loadConversations();
    }
  }, [userName]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_name', userName)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    }
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setShowNameDialog(false);
  };

  const handleInsertText = (text: string) => {
    // This function is passed to ChatInput to handle quick action insertions
    // The actual text insertion is handled by ChatInput's setMessage
  };

  const getSystemPrompt = (mode: AIMode): string => {
    const prompts = {
      "Study Mode": "You are a highly knowledgeable tutor who explains step by step, in one complete response (not broken across multiple turns). Always explain concepts clearly with examples. Focus on accuracy and depth, avoiding unnecessary fluff.",
      "Research Mode": "You are a world-class researcher with access to the latest web data. Provide factual, well-structured answers with references when possible. Avoid hallucinations, always prioritize reliability.",
      "Creative Mode": "You are an imaginative creator who can brainstorm, generate ideas, and write with creativity. Be expressive, vivid, and flexible. Provide multiple ideas when possible.",
      "Fun Mode": "You are a chill friend. Keep answers generally short(2-4 Sentence ), but make them a little longer if needed. Always respond in the same language as the user input: - If English → reply in English. - If Hinglish → reply in Hinglish. - If another language → match that language too. Keep the tone casual, fun, and natural like a real buddy, not like a teacher. Make sure responses feel lightweight, not too long.",
      "Debate Mode": "You are a sharp debater. When given a topic, analyze both sides with strong reasoning, evidence, and logical clarity. Stay objective but structured. End with a balanced conclusion or your strongest recommendation."
    };
    return prompts[mode];
  };

  const getAPIEndpoint = (mode: AIMode): string => {
    // Study, Research, Debate → Perplexity (mysterious1 or mysterious2)
    // Creative, Fun → Gemini (genius)
    if (mode === "Study Mode" || mode === "Research Mode" || mode === "Debate Mode") {
      return Math.random() > 0.5 ? "mysterious1" : "mysterious2"; // Randomly choose between the two Perplexity APIs
    }
    return "genius"; // Gemini for Creative and Fun modes
  };

  const getFunModeContext = (): string => {
    if (selectedMode !== "Fun Mode") return "";
    
    // Get last 2-3 Fun Mode conversations for context
    const funModeConvs = conversations
      .filter(conv => conv.ai_used === "Fun Mode")
      .slice(-3); // Last 3 conversations
    
    if (funModeConvs.length === 0) return "";
    
    let context = "Recent conversation context:\n";
    funModeConvs.forEach(conv => {
      context += `User: ${conv.prompt}\nYou: ${conv.reply}\n`;
    });
    context += "\nNow respond to the new message:";
    
    return context;
  };

  const handleSendMessage = async (messageText: string) => {
    if (!userName) return;

    setIsLoading(true);
    
    try {
      const apiEndpoint = getAPIEndpoint(selectedMode);
      const systemPrompt = getSystemPrompt(selectedMode);
      const context = getFunModeContext();
      const finalPrompt = context ? `${context}\n\n${messageText}` : messageText;

      // Call the selected API
      const response = await fetch(`https://aqalfovzkykgabcgmtsb.supabase.co/functions/v1/${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYWxmb3Z6a3lrZ2FiY2dtdHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNzU4ODQsImV4cCI6MjA3MTY1MTg4NH0.uYt5exNw0novG7IfKd5PtwjlBtLyvQ3Kfd14dTafqro`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          systemPrompt: systemPrompt,
          mode: selectedMode,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('conversations')
        .insert({
          user_name: userName,
          ai_used: selectedMode,
          prompt: messageText,
          reply: data.reply,
          inputtokencount: data.InputTokenCount,
          outputtokencount: data.OutputTokenCount,
          totaltokencount: data.totalTokenCount,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Warning",
          description: "Message sent but not saved to history",
          variant: "destructive",
        });
      }

      // Reload conversations to show the new message
      await loadConversations();

      toast({
        title: "Success",
        description: `Response generated using ${selectedMode}`,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderConversations = () => {
    const conversationElements: JSX.Element[] = [];
    
    conversations.forEach((conv) => {
      // Add user message
      conversationElements.push(
        <div key={`user-${conv.id}`} className="mb-4">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-chat-user/20 to-chat-user/10 border border-chat-user/30 text-chat-user-foreground ml-4">
              <div className="text-xs font-medium opacity-70 text-chat-user mb-1">
                {conv.user_name}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {conv.prompt}
              </div>
              <div className="text-xs opacity-50 mt-1">
                {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      );
      
      // Add AI response with token counts
      conversationElements.push(
        <div key={`ai-${conv.id}`} className="mb-4">
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-chat-ai/20 to-chat-ai/10 border border-chat-ai/30 text-chat-ai-foreground mr-4">
              <div className="text-xs font-medium opacity-70 text-chat-ai mb-1">
                AI ({conv.ai_used})
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
                {conv.reply}
              </div>
              <div className="text-xs opacity-60 border-t border-chat-ai/20 pt-2">
                Input: {conv.inputtokencount} | Output: {conv.outputtokencount} | Total: {conv.totaltokencount}
              </div>
              <div className="text-xs opacity-50 mt-1">
                {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      );
    });
    
    return conversationElements;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background/80">
      <UserNameDialog open={showNameDialog} onSubmit={handleNameSubmit} />
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Chat Assistant
          </h1>
          {userName && (
            <p className="text-sm text-muted-foreground">
              Welcome, {userName}!
            </p>
          )}
        </div>
        {userName && (
          <AISelector selectedMode={selectedMode} onSelectionChange={setSelectedMode} />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-12">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Start a conversation</p>
            <p className="text-sm">Ask me anything and I'll help you out!</p>
          </div>
        )}
        
        {renderConversations()}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-chat-ai/20 to-chat-ai/10 border border-chat-ai/30 mr-4">
              <div className="flex items-center gap-2 text-chat-ai-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        disabled={!userName}
        selectedMode={selectedMode}
        onInsertText={handleInsertText}
      />
    </div>
  );
};