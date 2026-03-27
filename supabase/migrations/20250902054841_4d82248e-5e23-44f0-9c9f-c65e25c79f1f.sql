-- Temporarily allow all authenticated users to manage customers while authentication is being set up
-- This will be updated later once users have proper roles assigned

-- Update customers policy to allow all authenticated users
DROP POLICY IF EXISTS "Admin and managers can manage customers" ON public.customers;
CREATE POLICY "Authenticated users can manage customers" 
ON public.customers 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Update suppliers policy to allow all authenticated users  
DROP POLICY IF EXISTS "Admin and managers can manage suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can manage suppliers"
ON public.suppliers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update locations policy to allow all authenticated users
DROP POLICY IF EXISTS "Only admins can manage locations" ON public.locations;
CREATE POLICY "Authenticated users can manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update outward entries policy to allow all authenticated users
DROP POLICY IF EXISTS "Operators can insert outward entries" ON public.outward_entries;
DROP POLICY IF EXISTS "Managers can update outward entries" ON public.outward_entries;
DROP POLICY IF EXISTS "All authenticated users can view outward entries" ON public.outward_entries;

CREATE POLICY "Authenticated users can manage outward entries"
ON public.outward_entries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);