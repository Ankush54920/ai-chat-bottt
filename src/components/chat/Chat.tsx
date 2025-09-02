import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { UserNameDialog } from "./UserNameDialog";
import { AISelector, AIMode } from "./AISelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, User, Brain, Smile, Heart, Gamepad2 } from "lucide-react";
import { StudyModeMessage } from "./StudyModeMessage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

type FunPersonality = "smart-nerd" | "funny-friend" | "chill-friend" | "supportive-mentor";

interface FunMemory {
  favoriteTopic?: string;
  currentMood?: string;
}

export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<AIMode>("Study Mode");
  const [isLoading, setIsLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [funPersonality, setFunPersonality] = useState<FunPersonality>("chill-friend");
  const [showMiniGameModal, setShowMiniGameModal] = useState(false);
  const [funMemory, setFunMemory] = useState<FunMemory>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated before scrolling
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [conversations, isLoading]);

  // Load personality and memory from localStorage
  useEffect(() => {
    const savedPersonality = localStorage.getItem('funPersonality') as FunPersonality;
    if (savedPersonality) {
      setFunPersonality(savedPersonality);
    }
    
    const savedMemory = localStorage.getItem('funMemory');
    if (savedMemory) {
      try {
        setFunMemory(JSON.parse(savedMemory));
      } catch (e) {
        console.error('Error parsing fun memory:', e);
      }
    }
  }, []);

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

  const handlePersonalityChange = (personality: FunPersonality) => {
    setFunPersonality(personality);
    localStorage.setItem('funPersonality', personality);
  };

  const handleMiniGameSelect = () => {
    setShowMiniGameModal(true);
  };

  const selectMiniGame = (game: string) => {
    setShowMiniGameModal(false);
    const gamePrompts = {
      "Trivia Mode": "Let's play trivia! Ask me one trivia question at a time and wait for my answer.",
      "Would You Rather": "Let's play Would You Rather! Give me a fun would you rather question.",
      "Guess the Emoji": "Let's play Guess the Emoji! Give me some emojis and I'll guess what they represent.",
      "Riddles": "Let's play riddles! Ask me a fun riddle and wait for my answer."
    };
    handleSendMessage(gamePrompts[game as keyof typeof gamePrompts] || "Let's play a fun game!");
  };

  const getPersonalityPrompt = (personality: FunPersonality): string => {
    const personalities = {
      "smart-nerd": "🤓 Smart Nerd – You are witty & logical, give clever responses with fun facts. Be intellectually playful.",
      "funny-friend": "😂 Funny Friend – You love memes, jokes, and sarcasm. Keep things entertaining and humorous.",
      "chill-friend": "😎 Chill Friend – You're casual and laid-back, mixing Hinglish/English naturally with a friendly vibe.",
      "supportive-mentor": "❤️ Supportive Mentor – You're motivational, comforting, and uplifting. Always encourage and inspire."
    };
    return personalities[personality];
  };

  const getSystemPrompt = (mode: AIMode): string => {
    const prompts = {
      "Study Mode": "You are a step-by-step problem solver and teacher. If the user asks a maths, physics, or chemistry question: - Solve step-by-step with clear, concise explanations. - Render every equation using LaTeX format (\\( ... \\)) or $$ ... $$ for display math so they render correctly in the UI. - Separate each step into its own block or line for better readability. - Do NOT include external links, citations, or [numbers] like [1] anywhere in the answer. - If the question is conceptual, give a short, direct explanation with no fluff. - If asked for a summary, give a 1-2 line crisp explanation at the end.",
      "Research Mode": "You are a world-class researcher with access to the latest web data. Provide factual, well-structured answers with references when possible. Avoid hallucinations, always prioritize reliability.",
      "Creative Mode": "You are an imaginative creator who can brainstorm, generate ideas, and write with creativity. Be expressive, vivid, and flexible. Provide multiple ideas when possible.",
      "Fun Mode": `You are a ${getPersonalityPrompt(funPersonality)}. Keep answers generally short, but slightly longer if needed. Match the language user is using (English, Hinglish, or any other language they type in). Be playful, friendly, and fun, not overly formal.${funMemory.favoriteTopic ? ` They like ${funMemory.favoriteTopic}, so occasionally mention it naturally.` : ''}${funMemory.currentMood ? ` They seem ${funMemory.currentMood} lately.` : ''}`,
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

  // Unified function to save conversation to database
  const saveConversationToDatabase = async (conversation: Omit<Conversation, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      console.log('Saving conversation payload:', {
        user_name: conversation.user_name,
        ai_used: conversation.ai_used,
        prompt: conversation.prompt,
        reply: conversation.reply,
        inputtokencount: conversation.inputtokencount,
        outputtokencount: conversation.outputtokencount,
        totaltokencount: conversation.totaltokencount,
      });

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_name: conversation.user_name,
          ai_used: conversation.ai_used,
          prompt: conversation.prompt,
          reply: conversation.reply,
          inputtokencount: conversation.inputtokencount,
          outputtokencount: conversation.outputtokencount,
          totaltokencount: conversation.totaltokencount,
        })
        .select();

      if (error) {
        console.error('Database save error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        toast({
          title: "Save Failed",
          description: `Failed to save to history: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('Successfully saved conversation:', data);
      return true;
    } catch (error) {
      console.error('Unexpected error saving conversation:', error);
      toast({
        title: "Save Error",
        description: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!userName) return;

    setIsLoading(true);
    
    try {
      const apiEndpoint = getAPIEndpoint(selectedMode);
      const systemPrompt = getSystemPrompt(selectedMode);
      const context = getFunModeContext();
      const finalPrompt = context ? `${context}\n\n${messageText}` : messageText;

      console.log(`Calling ${apiEndpoint} for ${selectedMode} mode`);
      
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
      console.log('API Response:', data);
      
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Create conversation object with proper token count mapping
      const conversationData = {
        user_name: userName,
        ai_used: selectedMode,
        prompt: messageText,
        reply: data.reply,
        inputtokencount: data.InputTokenCount || 0,
        outputtokencount: data.OutputTokenCount || 0,
        totaltokencount: data.totalTokenCount || 0,
      };

      // Create a new conversation object for immediate display
      const newConversation: Conversation = {
        ...conversationData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      // Add to conversations immediately for instant UI update
      setConversations(prev => [...prev, newConversation]);

      // Try to save to database with proper error handling
      const saveSuccess = await saveConversationToDatabase(conversationData);
      
      if (saveSuccess) {
        // Reload to get proper IDs and ensure sync
        await loadConversations();
        console.log(`Successfully saved ${selectedMode} message to database`);
      } else {
        console.log(`Failed to save ${selectedMode} message to database, but keeping in UI`);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Could not fetch response, please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderConversations = () => {
    const conversationElements: JSX.Element[] = [];
    
    conversations.forEach((conv) => {
      // Ensure we have valid data
      if (!conv.prompt || !conv.reply) return;
      
      // Add user message
      conversationElements.push(
        <div key={`user-${conv.id}`} className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-end">
            <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-chat-user/20 to-chat-user/10 border border-chat-user/30 text-chat-user-foreground ml-2 sm:ml-4 shadow-sm">
              <div className="text-xs font-medium opacity-70 text-chat-user mb-1">
                {conv.user_name}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {conv.prompt}
              </div>
              <div className="text-xs opacity-50 mt-1">
                {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      );
      
      // Add AI response - Special handling for Study Mode only
      if (conv.ai_used === "Study Mode") {
        conversationElements.push(
          <div key={`ai-${conv.id}`} className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
            <StudyModeMessage 
              message={conv.reply} 
              timestamp={new Date(conv.created_at)}
            />
            <div className="flex justify-start mt-2">
              <div className="max-w-[85%] mr-2 sm:mr-4">
                <div className="text-xs opacity-60 bg-muted/30 rounded-lg px-3 py-1 border border-border/30">
                  Input: {conv.inputtokencount} | Output: {conv.outputtokencount} | Total: {conv.totaltokencount}
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // All other modes (Fun Mode, Research Mode, etc.) use regular rendering
        conversationElements.push(
          <div key={`ai-${conv.id}`} className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-chat-ai/20 to-chat-ai/10 border border-chat-ai/30 text-chat-ai-foreground mr-2 sm:mr-4 shadow-sm">
                <div className="text-xs font-medium opacity-70 text-chat-ai mb-1">
                  AI ({conv.ai_used})
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {conv.reply}
                </div>
                <div className="text-xs opacity-60 border-t border-chat-ai/20 pt-2 mt-2">
                  Input: {conv.inputtokencount} | Output: {conv.outputtokencount} | Total: {conv.totaltokencount}
                </div>
                <div className="text-xs opacity-50 mt-1">
                  {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        );
      }
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
          <div className="flex items-center gap-2">
            {selectedMode === "Fun Mode" && (
              <Select value={funPersonality} onValueChange={handlePersonalityChange}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  <SelectItem value="smart-nerd">
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3" />
                      Smart Nerd
                    </div>
                  </SelectItem>
                  <SelectItem value="funny-friend">
                    <div className="flex items-center gap-2">
                      <Smile className="h-3 w-3" />
                      Funny Friend
                    </div>
                  </SelectItem>
                  <SelectItem value="chill-friend">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Chill Friend
                    </div>
                  </SelectItem>
                  <SelectItem value="supportive-mentor">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3" />
                      Supportive Mentor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <AISelector selectedMode={selectedMode} onSelectionChange={setSelectedMode} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--muted)) transparent',
            maxHeight: 'calc(100vh - 140px)',
            overscrollBehavior: 'none'
          }}
        >
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
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur-sm sticky bottom-0 z-10">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!userName}
          selectedMode={selectedMode}
          onInsertText={handleInsertText}
          onMiniGameSelect={handleMiniGameSelect}
        />
      </div>

      {/* Mini Game Selection Modal */}
      <Dialog open={showMiniGameModal} onOpenChange={setShowMiniGameModal}>
        <DialogContent className="sm:max-w-md bg-background border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Choose a Mini-Game
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              { name: "Trivia Mode", icon: "🧩", desc: "Test your knowledge" },
              { name: "Would You Rather", icon: "🎲", desc: "Tough choices" },
              { name: "Guess the Emoji", icon: "🕹", desc: "Decode the emojis" },
              { name: "Riddles", icon: "🧠", desc: "Brain teasers" }
            ].map((game) => (
              <Button
                key={game.name}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/80 transition-colors"
                onClick={() => selectMiniGame(game.name)}
              >
                <span className="text-2xl">{game.icon}</span>
                <div className="text-center">
                  <div className="font-medium text-sm">{game.name}</div>
                  <div className="text-xs text-muted-foreground">{game.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};