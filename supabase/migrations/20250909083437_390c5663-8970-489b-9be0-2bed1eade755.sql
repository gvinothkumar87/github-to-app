-- Fix security vulnerability in customers table
-- Remove the overly permissive policy that allows all authenticated users to manage customers
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;

-- Create more restrictive policies based on user roles
-- Only admin users can manage (insert, update, delete) customer data
CREATE POLICY "Only admins can manage customers" 
ON public.customers 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow users with 'manager' or 'admin' roles to view customer data
CREATE POLICY "Managers and admins can view customers" 
ON public.customers 
FOR SELECT 
TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);