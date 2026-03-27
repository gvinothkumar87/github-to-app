-- Fix transaction_type in error logging for create_sale_with_ledger and update_sale_with_ledger
-- Change 'create_sale' and 'update_sale' to 'sale' to match CHECK constraint

-- Drop and recreate create_sale_with_ledger with correct transaction_type
DROP FUNCTION IF EXISTS public.create_sale_with_ledger(JSONB, JSONB);

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
  -- Insert sale record (using created_by only, not user_id)
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
    p_sale_data->>'created_by'
  ) RETURNING id INTO v_sale_id;
  
  -- Insert customer ledger entry (transaction_type is always 'sale')
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
    'sale',
    v_sale_id,
    (p_ledger_data->>'debit_amount')::NUMERIC,
    COALESCE((p_ledger_data->>'credit_amount')::NUMERIC, 0),
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
  -- Log the error with correct transaction_type
  INSERT INTO public.failed_transactions (
    user_id,
    transaction_type,
    attempted_data,
    error_message,
    status
  ) VALUES (
    p_sale_data->>'created_by',
    'sale',  -- Changed from 'create_sale'
    jsonb_build_object('sale_data', p_sale_data, 'ledger_data', p_ledger_data),
    SQLERRM,
    'failed'
  );
  
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate update_sale_with_ledger with correct transaction_type
DROP FUNCTION IF EXISTS public.update_sale_with_ledger(UUID, JSONB, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.update_sale_with_ledger(
  p_sale_id UUID,
  p_sale_data JSONB,
  p_outward_entry_data JSONB,
  p_user_id TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_old_sale RECORD;
  v_ledger_id UUID;
  v_result JSONB;
BEGIN
  -- Get current sale data
  SELECT * INTO v_old_sale FROM public.sales WHERE id = p_sale_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;
  
  -- Update sale record
  UPDATE public.sales
  SET
    rate = COALESCE((p_sale_data->>'rate')::NUMERIC, rate),
    total_amount = COALESCE((p_sale_data->>'total_amount')::NUMERIC, total_amount),
    base_amount = COALESCE((p_sale_data->>'base_amount')::NUMERIC, base_amount),
    gst_amount = COALESCE((p_sale_data->>'gst_amount')::NUMERIC, gst_amount),
    sale_date = COALESCE((p_sale_data->>'sale_date')::DATE, sale_date),
    bill_serial_no = COALESCE(p_sale_data->>'bill_serial_no', bill_serial_no),
    irn = COALESCE(p_sale_data->>'irn', irn),
    updated_at = now()
  WHERE id = p_sale_id;
  
  -- Update outward entry if data provided
  IF p_outward_entry_data IS NOT NULL THEN
    UPDATE public.outward_entries
    SET
      empty_weight = COALESCE((p_outward_entry_data->>'empty_weight')::NUMERIC, empty_weight),
      load_weight = COALESCE((p_outward_entry_data->>'load_weight')::NUMERIC, load_weight),
      updated_at = now()
    WHERE id = v_old_sale.outward_entry_id;
  END IF;
  
  -- Update customer ledger entry
  UPDATE public.customer_ledger
  SET
    debit_amount = COALESCE((p_sale_data->>'total_amount')::NUMERIC, debit_amount),
    transaction_date = COALESCE((p_sale_data->>'sale_date')::DATE, transaction_date),
    updated_at = now()
  WHERE reference_id = p_sale_id AND transaction_type = 'sale'
  RETURNING id INTO v_ledger_id;
  
  -- Recalculate customer ledger balances
  PERFORM public.recalculate_customer_ledger_balances(
    v_old_sale.customer_id,
    COALESCE((p_sale_data->>'sale_date')::DATE, v_old_sale.sale_date)
  );
  
  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'sale_id', p_sale_id,
    'ledger_id', v_ledger_id
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error with correct transaction_type
  INSERT INTO public.failed_transactions (
    user_id,
    transaction_type,
    attempted_data,
    error_message,
    status
  ) VALUES (
    COALESCE(p_user_id, v_old_sale.created_by),
    'sale',  -- Changed from 'update_sale'
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