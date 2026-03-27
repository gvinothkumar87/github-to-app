-- Fix critical security vulnerability: Business Financial Records exposed publicly
-- Replace overly permissive policies with proper authentication and role-based access

-- 1. FIX SALES TABLE
DROP POLICY IF EXISTS "Allow all access to sales" ON public.sales;

-- Create restrictive policies for sales table
CREATE POLICY "Authenticated users can view sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sales" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update sales" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role))
WITH CHECK (has_role(auth.uid()::text, 'admin'::app_role));

CREATE POLICY "Admins can delete sales" 
ON public.sales 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- 2. FIX RECEIPTS TABLE
DROP POLICY IF EXISTS "Allow all access to receipts" ON public.receipts;

-- Create restrictive policies for receipts table
CREATE POLICY "Authenticated users can view receipts" 
ON public.receipts 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert receipts" 
ON public.receipts 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update receipts" 
ON public.receipts 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role))
WITH CHECK (has_role(auth.uid()::text, 'admin'::app_role));

CREATE POLICY "Admins can delete receipts" 
ON public.receipts 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- 3. FIX CUSTOMER_LEDGER TABLE
DROP POLICY IF EXISTS "Allow all access to customer_ledger" ON public.customer_ledger;

-- Create restrictive policies for customer_ledger table
CREATE POLICY "Authenticated users can view customer ledger" 
ON public.customer_ledger 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customer ledger entries" 
ON public.customer_ledger 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update customer ledger" 
ON public.customer_ledger 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role))
WITH CHECK (has_role(auth.uid()::text, 'admin'::app_role));

CREATE POLICY "Admins can delete customer ledger entries" 
ON public.customer_ledger 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- 4. FIX OUTWARD_ENTRIES TABLE
DROP POLICY IF EXISTS "Allow all access to outward_entries" ON public.outward_entries;

-- Create restrictive policies for outward_entries table
CREATE POLICY "Authenticated users can view outward entries" 
ON public.outward_entries 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert outward entries" 
ON public.outward_entries 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update outward entries" 
ON public.outward_entries 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete outward entries" 
ON public.outward_entries 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));