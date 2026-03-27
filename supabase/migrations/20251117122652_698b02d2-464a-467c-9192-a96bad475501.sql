-- Allow authenticated users to delete customer ledger entries
-- This is needed so bills can be deleted along with their ledger entries
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can delete customer ledger" ON public.customer_ledger;
CREATE POLICY "Authenticated users can delete customer ledger"
ON public.customer_ledger
FOR DELETE
TO authenticated
USING (true);