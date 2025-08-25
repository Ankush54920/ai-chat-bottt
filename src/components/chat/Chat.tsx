import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { UserNameDialog } from "./UserNameDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle } from "lucide-react";

interface Message {
  id: number;
  message: string;
  response: string;
  user_name: string;
  created_at: string;
  model_used?: string;
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversations
  useEffect(() => {
    if (userName) {
      loadConversations();
    }
  }, [userName]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('Conversation')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
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

  const handleSendMessage = async (messageText: string) => {
    if (!userName) return;

    setIsLoading(true);
    
    try {
      // Call the chat API
      const response = await fetch(`https://aqalfovzkykgabcgmtsb.supabase.co/functions/v1/chat-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYWxmb3Z6a3lrZ2FiY2dtdHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNzU4ODQsImV4cCI6MjA3MTY1MTg4NH0.uYt5exNw0novG7IfKd5PtwjlBtLyvQ3Kfd14dTafqro`,
        },
        body: JSON.stringify({
          message: messageText,
          userName: userName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('Conversation')
        .insert({
          user_name: userName,
          message: messageText,
          response: data.response,
          model_used: data.model,
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
        description: `Response generated using ${data.model}`,
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

  const renderMessages = () => {
    const messageElements: JSX.Element[] = [];
    
    messages.forEach((msg) => {
      // Add user message
      messageElements.push(
        <ChatMessage
          key={`user-${msg.id}`}
          message={msg.message}
          isUser={true}
          userName={msg.user_name}
          timestamp={new Date(msg.created_at)}
        />
      );
      
      // Add AI response
      messageElements.push(
        <ChatMessage
          key={`ai-${msg.id}`}
          message={msg.response}
          isUser={false}
          timestamp={new Date(msg.created_at)}
        />
      );
    });
    
    return messageElements;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background/80">
      <UserNameDialog open={showNameDialog} onSubmit={handleNameSubmit} />
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Chat Assistant
          </h1>
          {userName && (
            <p className="text-sm text-muted-foreground">
              Welcome, {userName}!
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-12">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Start a conversation</p>
            <p className="text-sm">Ask me anything and I'll help you out!</p>
          </div>
        )}
        
        {renderMessages()}
        
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
      />
    </div>
  );
};