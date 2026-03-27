-- Create trigger function to automatically create customer ledger entries for receipts
CREATE OR REPLACE FUNCTION public.handle_receipt_ledger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert into customer ledger as credit (reduces customer debt)
    INSERT INTO public.customer_ledger (
      customer_id,
      transaction_type,
      reference_id,
      debit_amount,
      credit_amount,
      transaction_date,
      description
    ) VALUES (
      NEW.customer_id,
      'receipt',
      NEW.id,
      0,
      NEW.amount,
      NEW.receipt_date,
      'Receipt ' || NEW.receipt_no
    );
    
    -- Update customer balance
    UPDATE public.customer_ledger 
    SET balance = (
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
      FROM public.customer_ledger 
      WHERE customer_id = NEW.customer_id
    )
    WHERE customer_id = NEW.customer_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from customer ledger
    DELETE FROM public.customer_ledger 
    WHERE transaction_type = 'receipt' AND reference_id = OLD.id;
    
    -- Update customer balance
    UPDATE public.customer_ledger 
    SET balance = (
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
      FROM public.customer_ledger 
      WHERE customer_id = OLD.customer_id
    )
    WHERE customer_id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger on receipts table
CREATE OR REPLACE TRIGGER receipt_ledger_trigger
  AFTER INSERT OR DELETE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_receipt_ledger();

-- Create data integrity check function to find and fix orphaned receipts
CREATE OR REPLACE FUNCTION public.check_and_fix_receipt_ledger_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  orphaned_receipt RECORD;
  fixed_count INTEGER := 0;
  orphaned_receipts jsonb := '[]'::jsonb;
BEGIN
  -- Find receipts without corresponding customer ledger entries
  FOR orphaned_receipt IN
    SELECT r.id, r.receipt_no, r.customer_id, r.amount, r.receipt_date
    FROM public.receipts r
    LEFT JOIN public.customer_ledger cl ON (cl.reference_id = r.id AND cl.transaction_type = 'receipt')
    WHERE cl.id IS NULL
  LOOP
    -- Add to orphaned receipts list
    orphaned_receipts := orphaned_receipts || jsonb_build_object(
      'receipt_id', orphaned_receipt.id,
      'receipt_no', orphaned_receipt.receipt_no,
      'customer_id', orphaned_receipt.customer_id,
      'amount', orphaned_receipt.amount,
      'receipt_date', orphaned_receipt.receipt_date
    );
    
    -- Create missing customer ledger entry
    INSERT INTO public.customer_ledger (
      customer_id,
      transaction_type,
      reference_id,
      debit_amount,
      credit_amount,
      transaction_date,
      description
    ) VALUES (
      orphaned_receipt.customer_id,
      'receipt',
      orphaned_receipt.id,
      0,
      orphaned_receipt.amount,
      orphaned_receipt.receipt_date,
      'Receipt ' || orphaned_receipt.receipt_no || ' (Auto-fixed)'
    );
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  -- Update customer balances for affected customers
  UPDATE public.customer_ledger 
  SET balance = (
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    FROM public.customer_ledger cl2
    WHERE cl2.customer_id = customer_ledger.customer_id
  )
  WHERE customer_id IN (
    SELECT DISTINCT customer_id 
    FROM jsonb_to_recordset(orphaned_receipts) AS x(customer_id uuid)
  );
  
  RETURN jsonb_build_object(
    'orphaned_receipts_found', jsonb_array_length(orphaned_receipts),
    'receipts_fixed', fixed_count,
    'orphaned_receipts', orphaned_receipts
  );
END;
$function$;

-- Fix the missing RCP000003 ledger entry
SELECT public.check_and_fix_receipt_ledger_integrity();