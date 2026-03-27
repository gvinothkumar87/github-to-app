-- Fix remaining tables with overly permissive policies

-- 5. FIX CUSTOMERS TABLE 
DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers;

-- Create restrictive policies for customers table
CREATE POLICY "Authenticated users can view customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customers" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- 6. FIX ITEMS TABLE
DROP POLICY IF EXISTS "Allow all access to items" ON public.items;

-- Create restrictive policies for items table
CREATE POLICY "Authenticated users can view items" 
ON public.items 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert items" 
ON public.items 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update items" 
ON public.items 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete items" 
ON public.items 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- 7. FIX LEDGERS TABLE
DROP POLICY IF EXISTS "Allow all access to ledgers" ON public.ledgers;

-- Create restrictive policies for ledgers table
CREATE POLICY "Authenticated users can view ledgers" 
ON public.ledgers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create their own ledgers" 
ON public.ledgers 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can update their own ledgers" 
ON public.ledgers 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Admins can delete ledgers" 
ON public.ledgers 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- 8. FIX CUSTOMER_LEDGER_MAPPING TABLE
DROP POLICY IF EXISTS "Allow all access to customer_ledger_mapping" ON public.customer_ledger_mapping;

-- Create restrictive policies for customer_ledger_mapping table
CREATE POLICY "Authenticated users can view customer ledger mapping" 
ON public.customer_ledger_mapping 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create customer ledger mappings" 
ON public.customer_ledger_mapping 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can update their customer ledger mappings" 
ON public.customer_ledger_mapping 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Admins can delete customer ledger mappings" 
ON public.customer_ledger_mapping 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));