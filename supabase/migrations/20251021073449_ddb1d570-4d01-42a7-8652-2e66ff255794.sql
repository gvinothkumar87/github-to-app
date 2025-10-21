-- Phase 1: Add missing columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS base_amount NUMERIC,
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC;

-- Create balance calculation trigger for customer_ledger
CREATE OR REPLACE FUNCTION public.calculate_customer_balance()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  prev_balance NUMERIC := 0;
BEGIN
  -- Get previous balance from the most recent transaction before this one
  SELECT COALESCE(balance, 0) INTO prev_balance
  FROM public.customer_ledger
  WHERE customer_id = NEW.customer_id
    AND transaction_date < NEW.transaction_date
    OR (transaction_date = NEW.transaction_date AND created_at < NEW.created_at)
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;
  
  -- If no previous transactions found, start from 0
  IF prev_balance IS NULL THEN
    prev_balance := 0;
  END IF;
  
  -- Calculate new balance: previous balance + debit - credit
  NEW.balance := prev_balance + NEW.debit_amount - NEW.credit_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate balance
DROP TRIGGER IF EXISTS auto_calculate_customer_balance ON public.customer_ledger;
CREATE TRIGGER auto_calculate_customer_balance
BEFORE INSERT OR UPDATE ON public.customer_ledger
FOR EACH ROW
EXECUTE FUNCTION public.calculate_customer_balance();

-- Phase 3: Create update_sale_with_ledger RPC function
CREATE OR REPLACE FUNCTION public.update_sale_with_ledger(
  p_sale_id UUID,
  p_sale_data JSONB,
  p_outward_entry_data JSONB DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_old_sale RECORD;
  v_old_ledger_id UUID;
  v_new_sale RECORD;
  v_result JSONB;
BEGIN
  -- Get the old sale record
  SELECT * INTO v_old_sale
  FROM public.sales
  WHERE id = p_sale_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sale not found');
  END IF;
  
  -- Update the sale record
  UPDATE public.sales
  SET 
    rate = COALESCE((p_sale_data->>'rate')::NUMERIC, rate),
    total_amount = COALESCE((p_sale_data->>'total_amount')::NUMERIC, total_amount),
    base_amount = COALESCE((p_sale_data->>'base_amount')::NUMERIC, base_amount),
    gst_amount = COALESCE((p_sale_data->>'gst_amount')::NUMERIC, gst_amount),
    irn = COALESCE(p_sale_data->>'irn', irn),
    bill_serial_no = COALESCE(p_sale_data->>'bill_serial_no', bill_serial_no),
    sale_date = COALESCE((p_sale_data->>'sale_date')::DATE, sale_date),
    updated_at = now()
  WHERE id = p_sale_id
  RETURNING * INTO v_new_sale;
  
  -- Update outward entry if data provided
  IF p_outward_entry_data IS NOT NULL THEN
    UPDATE public.outward_entries
    SET
      load_weight = COALESCE((p_outward_entry_data->>'load_weight')::NUMERIC, load_weight),
      empty_weight = COALESCE((p_outward_entry_data->>'empty_weight')::NUMERIC, empty_weight),
      updated_at = now()
    WHERE id = v_old_sale.outward_entry_id;
  END IF;
  
  -- If amount changed, update the customer ledger entry
  IF v_old_sale.total_amount != v_new_sale.total_amount THEN
    -- Find the ledger entry for this sale
    SELECT id INTO v_old_ledger_id
    FROM public.customer_ledger
    WHERE reference_id = p_sale_id
      AND transaction_type = 'sale';
    
    IF v_old_ledger_id IS NOT NULL THEN
      -- Update the ledger entry with new amount
      UPDATE public.customer_ledger
      SET 
        debit_amount = v_new_sale.total_amount,
        transaction_date = v_new_sale.sale_date,
        description = 'Sale - Bill #' || COALESCE(v_new_sale.bill_serial_no, v_new_sale.id::TEXT) || ' (Updated)',
        updated_at = now()
      WHERE id = v_old_ledger_id;
      
      -- Recalculate balances for all subsequent transactions
      PERFORM public.recalculate_customer_ledger_balances(v_old_sale.customer_id, v_new_sale.sale_date);
    END IF;
  END IF;
  
  -- Return the updated sale
  v_result := jsonb_build_object(
    'success', true,
    'sale', row_to_json(v_new_sale)
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  INSERT INTO public.failed_transactions (
    user_id,
    transaction_type,
    attempted_data,
    error_message,
    status
  ) VALUES (
    COALESCE(p_user_id, v_old_sale.user_id),
    'update_sale',
    jsonb_build_object(
      'sale_id', p_sale_id,
      'sale_data', p_sale_data,
      'outward_entry_data', p_outward_entry_data
    ),
    SQLERRM,
    'failed'
  );
  
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Create function to recalculate customer ledger balances from a specific date
CREATE OR REPLACE FUNCTION public.recalculate_customer_ledger_balances(
  p_customer_id UUID,
  p_from_date DATE
)
RETURNS VOID
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_ledger_record RECORD;
  v_running_balance NUMERIC := 0;
BEGIN
  -- Get the balance just before the from_date
  SELECT COALESCE(balance, 0) INTO v_running_balance
  FROM public.customer_ledger
  WHERE customer_id = p_customer_id
    AND transaction_date < p_from_date
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;
  
  -- Recalculate all balances from the from_date onwards
  FOR v_ledger_record IN
    SELECT id, debit_amount, credit_amount
    FROM public.customer_ledger
    WHERE customer_id = p_customer_id
      AND transaction_date >= p_from_date
    ORDER BY transaction_date ASC, created_at ASC
  LOOP
    v_running_balance := v_running_balance + v_ledger_record.debit_amount - v_ledger_record.credit_amount;
    
    UPDATE public.customer_ledger
    SET balance = v_running_balance
    WHERE id = v_ledger_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update create_sale_with_ledger to include base_amount and gst_amount
CREATE OR REPLACE FUNCTION public.create_sale_with_ledger(
  p_sale_data JSONB,
  p_ledger_data JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_sale_id UUID;
  v_ledger_id UUID;
  v_result JSONB;
BEGIN
  -- Insert sale record
  INSERT INTO public.sales (
    outward_entry_id,
    customer_id,
    item_id,
    quantity,
    rate,
    total_amount,
    base_amount,
    gst_amount,
    sale_date,
    bill_serial_no,
    irn,
    user_id,
    created_by
  ) VALUES (
    (p_sale_data->>'outward_entry_id')::UUID,
    (p_sale_data->>'customer_id')::UUID,
    (p_sale_data->>'item_id')::UUID,
    (p_sale_data->>'quantity')::NUMERIC,
    (p_sale_data->>'rate')::NUMERIC,
    (p_sale_data->>'total_amount')::NUMERIC,
    (p_sale_data->>'base_amount')::NUMERIC,
    (p_sale_data->>'gst_amount')::NUMERIC,
    (p_sale_data->>'sale_date')::DATE,
    p_sale_data->>'bill_serial_no',
    p_sale_data->>'irn',
    p_sale_data->>'user_id',
    p_sale_data->>'created_by'
  ) RETURNING id INTO v_sale_id;
  
  -- Insert customer ledger entry
  INSERT INTO public.customer_ledger (
    customer_id,
    transaction_type,
    reference_id,
    debit_amount,
    credit_amount,
    transaction_date,
    description
  ) VALUES (
    (p_ledger_data->>'customer_id')::UUID,
    p_ledger_data->>'transaction_type',
    v_sale_id,
    (p_ledger_data->>'debit_amount')::NUMERIC,
    (p_ledger_data->>'credit_amount')::NUMERIC,
    (p_ledger_data->>'transaction_date')::DATE,
    p_ledger_data->>'description'
  ) RETURNING id INTO v_ledger_id;
  
  -- Mark outward entry as converted to sale
  UPDATE public.outward_entries
  SET 
    is_sale = true,
    updated_at = now()
  WHERE id = (p_sale_data->>'outward_entry_id')::UUID;
  
  -- Return success with IDs
  v_result := jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'ledger_id', v_ledger_id
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  INSERT INTO public.failed_transactions (
    user_id,
    transaction_type,
    attempted_data,
    error_message,
    status
  ) VALUES (
    p_sale_data->>'user_id',
    'create_sale',
    jsonb_build_object('sale_data', p_sale_data, 'ledger_data', p_ledger_data),
    SQLERRM,
    'failed'
  );
  
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Backfill existing sales with base_amount and gst_amount
UPDATE public.sales s
SET 
  base_amount = s.quantity * s.rate,
  gst_amount = (s.quantity * s.rate * i.gst_percentage / 100)
FROM public.items i
WHERE s.item_id = i.id
  AND s.base_amount IS NULL;

-- Recalculate all customer ledger balances
DO $$
DECLARE
  v_customer RECORD;
BEGIN
  FOR v_customer IN SELECT DISTINCT customer_id FROM public.customer_ledger
  LOOP
    PERFORM public.recalculate_customer_ledger_balances(
      v_customer.customer_id, 
      (SELECT MIN(transaction_date) FROM public.customer_ledger WHERE customer_id = v_customer.customer_id)
    );
  END LOOP;
END $$;