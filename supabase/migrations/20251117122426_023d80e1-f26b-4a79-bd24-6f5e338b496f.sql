-- Sales: allow delete for any authenticated user (in addition to existing admin/self policies)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
CREATE POLICY "Authenticated users can delete sales"
ON public.sales
FOR DELETE
TO authenticated
USING (true);

-- Outward entries: allow delete for any authenticated user
ALTER TABLE public.outward_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can delete outward entries" ON public.outward_entries;
CREATE POLICY "Authenticated users can delete outward entries"
ON public.outward_entries
FOR DELETE
TO authenticated
USING (true);

-- Optional: allow delete for receipts, purchases if needed later (commented out)
-- CREATE POLICY "Authenticated users can delete receipts" ON public.receipts FOR DELETE TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can delete purchases" ON public.purchases FOR DELETE TO authenticated USING (true);