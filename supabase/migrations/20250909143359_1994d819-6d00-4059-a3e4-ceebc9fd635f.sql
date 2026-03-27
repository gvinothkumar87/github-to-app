-- Fix security warnings by setting search_path for functions
-- Update generate_receipt_no function with proper search_path
CREATE OR REPLACE FUNCTION public.generate_receipt_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_no INTEGER;
    receipt_no TEXT;
BEGIN
    -- Get the next receipt number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 'RCP-\\d{8}-(\\d+)') AS INTEGER)), 0) + 1
    INTO next_no
    FROM public.receipts
    WHERE receipt_date = CURRENT_DATE;
    
    -- Generate receipt number with format RCP-YYYYMMDD-001
    receipt_no := 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_no::TEXT, 3, '0');
    
    RETURN receipt_no;
END;
$$;

-- Update update_customer_balance function with proper search_path
CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_balance NUMERIC := 0;
BEGIN
    -- Calculate running balance for this customer
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO current_balance
    FROM public.customer_ledger
    WHERE customer_id = NEW.customer_id
    AND created_at <= NEW.created_at;
    
    -- Update the balance for the new record
    NEW.balance := current_balance;
    
    RETURN NEW;
END;
$$;