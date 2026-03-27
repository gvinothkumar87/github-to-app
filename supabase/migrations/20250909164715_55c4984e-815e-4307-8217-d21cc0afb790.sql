-- Fix the generate_receipt_no function to resolve column ambiguity
CREATE OR REPLACE FUNCTION public.generate_receipt_no()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_receipt_no TEXT;
BEGIN
  -- Get the next receipt number with proper table qualification
  SELECT COALESCE(MAX(CAST(SUBSTRING(public.receipts.receipt_no FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.receipts
  WHERE public.receipts.receipt_no ~ '^RCP[0-9]+$';
  
  -- Format as RCP000001, RCP000002, etc.
  new_receipt_no := 'RCP' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_receipt_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;