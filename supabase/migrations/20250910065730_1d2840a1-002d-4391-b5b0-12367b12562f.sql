-- Fix transaction_cache RLS policies to prevent public access to user financial data
-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage transaction cache" ON public.transaction_cache;

-- Create more restrictive policies for system operations
-- Allow system to insert/update cache records (for cache management)
CREATE POLICY "System can insert transaction cache" 
ON public.transaction_cache 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update transaction cache" 
ON public.transaction_cache 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow system to delete cache records (for cleanup)
CREATE POLICY "System can delete transaction cache" 
ON public.transaction_cache 
FOR DELETE 
USING (true);

-- Ensure existing policies for user and admin access are still in place
-- (These should already exist but let's verify they're correct)

-- Users can only view their own transaction cache
DROP POLICY IF EXISTS "Users can view their own transaction cache" ON public.transaction_cache;
CREATE POLICY "Users can view their own transaction cache" 
ON public.transaction_cache 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Admins can view all transaction cache
DROP POLICY IF EXISTS "Admins can view all transaction cache" ON public.transaction_cache;
CREATE POLICY "Admins can view all transaction cache" 
ON public.transaction_cache 
FOR SELECT 
USING (has_role(auth.uid()::text, 'admin'::app_role));