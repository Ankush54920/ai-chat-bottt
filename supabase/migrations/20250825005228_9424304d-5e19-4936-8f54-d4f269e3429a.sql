-- Update the existing conversations table to match the requirements
ALTER TABLE public."Conversation" 
RENAME COLUMN "user_message" TO "message";

ALTER TABLE public."Conversation" 
RENAME COLUMN "ai_response" TO "response";

ALTER TABLE public."Conversation" 
RENAME COLUMN "timestamp" TO "created_at";

-- Set default value for created_at
ALTER TABLE public."Conversation" 
ALTER COLUMN "created_at" SET DEFAULT now();

-- Make sure user_name is not nullable
ALTER TABLE public."Conversation" 
ALTER COLUMN "user_name" SET NOT NULL;

-- Enable RLS for conversations
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert and read conversations (public chat)
CREATE POLICY "Allow public access to conversations" 
ON public."Conversation" 
FOR ALL 
USING (true) 
WITH CHECK (true);