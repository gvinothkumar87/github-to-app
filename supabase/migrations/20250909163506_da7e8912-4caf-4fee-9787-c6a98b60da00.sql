-- Update RLS policies to work without authentication requirement
-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;

DROP POLICY IF EXISTS "Authenticated users can view items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can create items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.items;

-- Create new policies that allow access without authentication
CREATE POLICY "Allow all access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to outward_entries" ON public.outward_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to receipts" ON public.receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to customer_ledger" ON public.customer_ledger FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to customer_ledger_mapping" ON public.customer_ledger_mapping FOR ALL USING (true) WITH CHECK (true);

-- Drop existing specific policies and replace with general ones
DROP POLICY IF EXISTS "Authenticated users can view outward entries" ON public.outward_entries;
DROP POLICY IF EXISTS "Authenticated users can create outward entries" ON public.outward_entries;
DROP POLICY IF EXISTS "Authenticated users can update outward entries" ON public.outward_entries;

DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;

DROP POLICY IF EXISTS "Authenticated users can view receipts" ON public.receipts;
DROP POLICY IF EXISTS "Authenticated users can create receipts" ON public.receipts;
DROP POLICY IF EXISTS "Authenticated users can update receipts" ON public.receipts;

DROP POLICY IF EXISTS "Authenticated users can view customer ledger" ON public.customer_ledger;
DROP POLICY IF EXISTS "Authenticated users can create customer ledger" ON public.customer_ledger;
DROP POLICY IF EXISTS "Authenticated users can update customer ledger" ON public.customer_ledger;

DROP POLICY IF EXISTS "Authenticated users can view customer ledger mapping" ON public.customer_ledger_mapping;
DROP POLICY IF EXISTS "Authenticated users can create customer ledger mapping" ON public.customer_ledger_mapping;
DROP POLICY IF EXISTS "Authenticated users can update customer ledger mapping" ON public.customer_ledger_mapping;