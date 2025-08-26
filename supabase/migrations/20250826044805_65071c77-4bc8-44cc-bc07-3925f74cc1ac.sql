-- Create new conversations table with the required schema
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  ai_used TEXT NOT NULL,
  prompt TEXT NOT NULL,
  reply TEXT NOT NULL,
  InputTokenCount INTEGER DEFAULT 0,
  OutputTokenCount INTEGER DEFAULT 0,
  totalTokenCount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access (since this is a public chat)
CREATE POLICY "Allow public access to conversations" 
ON public.conversations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for better performance when fetching by user_name
CREATE INDEX idx_conversations_user_name ON public.conversations(user_name);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);