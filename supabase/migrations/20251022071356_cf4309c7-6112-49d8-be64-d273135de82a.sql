-- Phase 1: Drop old duplicate trigger and function
DROP TRIGGER IF EXISTS calculate_customer_balance ON public.customer_ledger;
DROP FUNCTION IF EXISTS public.update_customer_balance();

-- Phase 2: Fix create_sale_with_ledger - remove duplicate user_id field
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
  
  -- Insert customer ledger entry (transaction_type is always 'sale', no need to pass it)
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
  -- Log the error
  INSERT INTO public.failed_transactions (
    user_id,
    transaction_type,
    attempted_data,
    error_message,
    status
  ) VALUES (
    p_sale_data->>'created_by',
    'create_sale',
    jsonb_build_object('sale_data', p_sale_data, 'ledger_data', p_ledger_data),
    SQLERRM,
    'failed'
  );
  
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Phase 6: Recalculate all customer ledger balances for safety
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