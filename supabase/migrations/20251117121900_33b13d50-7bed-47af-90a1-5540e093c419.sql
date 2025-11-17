-- Enable RLS on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policies if any
DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;
DROP POLICY IF EXISTS "Allow users to delete sales" ON public.sales;

-- Allow admins to delete any sales rows
CREATE POLICY "Admins can delete sales" 
ON public.sales
FOR DELETE
TO authenticated
USING (public.has_role((auth.uid())::text, 'admin'::app_role));

-- Allow users to delete sales they created
CREATE POLICY "Users can delete their own sales" 
ON public.sales
FOR DELETE
TO authenticated
USING (
  (created_by IS NOT NULL) AND 
  ((created_by)::text = (auth.uid())::text)
);