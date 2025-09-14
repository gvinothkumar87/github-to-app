-- Fix security vulnerability: Restrict company_settings access to admins only
-- Remove the overly permissive policy that allows all authenticated users to view company settings
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON public.company_settings;

-- Create a new restrictive policy that only allows admins to view company settings
CREATE POLICY "Only admins can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (has_role((auth.uid())::text, 'admin'::app_role));