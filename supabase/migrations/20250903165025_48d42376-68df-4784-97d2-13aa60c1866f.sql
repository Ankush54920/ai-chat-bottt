-- Create users table for simple username/password authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all usernames for login" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create a user account" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Add user_id column to conversations table to link messages to users
ALTER TABLE public.conversations 
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Update conversations RLS policy to only show user's own conversations
DROP POLICY IF EXISTS "Allow public access to conversations" ON public.conversations;

CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Users can insert their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (true);