-- Fix user_balance_cache RLS policies to prevent public access to user financial data
-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage balance cache" ON public.user_balance_cache;

-- Create more restrictive policies for system operations
-- Allow system to insert/update cache records (for cache management)
CREATE POLICY "System can insert balance cache" 
ON public.user_balance_cache 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update balance cache" 
ON public.user_balance_cache 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow system to delete cache records (for cleanup)
CREATE POLICY "System can delete balance cache" 
ON public.user_balance_cache 
FOR DELETE 
USING (true);

-- Ensure existing policies for user and admin access are still in place
-- Users can only view their own balance cache
DROP POLICY IF EXISTS "Users can view their own balance cache" ON public.user_balance_cache;
CREATE POLICY "Users can view their own balance cache" 
ON public.user_balance_cache 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Admins can view all balance cache
DROP POLICY IF EXISTS "Admins can view all balance cache" ON public.user_balance_cache;
CREATE POLICY "Admins can view all balance cache" 
ON public.user_balance_cache 
FOR SELECT 
USING (has_role(auth.uid()::text, 'admin'::app_role));