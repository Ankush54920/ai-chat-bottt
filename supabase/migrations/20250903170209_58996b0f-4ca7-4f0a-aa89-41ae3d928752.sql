-- Drop existing policies on conversations table
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow public access to conversations" ON public.conversations;

-- Create new policy that allows all operations for all users
CREATE POLICY "Allow public access to conversations"
ON public.conversations
FOR ALL
USING (true)
WITH CHECK (true);