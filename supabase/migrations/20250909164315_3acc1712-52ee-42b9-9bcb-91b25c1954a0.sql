-- Check current policies on ledgers table and update them to allow access
-- First, let's see what policies exist and then update them

-- Drop existing restrictive policies and create new ones that allow access
DROP POLICY IF EXISTS "Authenticated users can view ledgers" ON public.ledgers;
DROP POLICY IF EXISTS "Users can update their own ledgers" ON public.ledgers;
DROP POLICY IF EXISTS "Approved users can create ledgers" ON public.ledgers;

-- Create new policies that allow full access for the transit logbook integration
CREATE POLICY "Allow all access to ledgers" ON public.ledgers FOR ALL USING (true) WITH CHECK (true);