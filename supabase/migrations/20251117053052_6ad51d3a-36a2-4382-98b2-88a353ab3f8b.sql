-- Fix: Add loading_place and lorry_no to create_sale_with_ledger function
-- This ensures the correct company address is used on invoices

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
  -- Validate loading_place is provided
  IF p_sale_data->>'loading_place' IS NULL OR p_sale_data->>'loading_place' = '' THEN
    RAISE EXCEPTION 'loading_place is required for creating sales';
  END IF;

  -- Insert sale record with loading_place and lorry_no
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
    created_by,
    loading_place,
    lorry_no
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
    p_sale_data->>'created_by',
    p_sale_data->>'loading_place',
    p_sale_data->>'lorry_no'
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
    'sale',
    v_sale_id,
    (p_ledger_data->>'debit_amount')::NUMERIC,
    COALESCE((p_ledger_data->>'credit_amount')::NUMERIC, 0),
    (p_ledger_data->>'transaction_date')::DATE,
    p_ledger_data->>'description'
  ) RETURNING id INTO v_ledger_id;
  
  -- Return success with IDs
  v_result := jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'ledger_id', v_ledger_id
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.failed_transactions (
    user_id,
    transaction_type,
    attempted_data,
    error_message,
    status
  ) VALUES (
    p_sale_data->>'created_by',
    'sale',
    jsonb_build_object('sale_data', p_sale_data, 'ledger_data', p_ledger_data),
    SQLERRM,
    'failed'
  );
  
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Add database constraint to prevent NULL values
ALTER TABLE sales 
  ALTER COLUMN loading_place SET NOT NULL;

-- Add check constraint for valid values
ALTER TABLE sales 
  DROP CONSTRAINT IF EXISTS sales_loading_place_valid;
  
ALTER TABLE sales 
  ADD CONSTRAINT sales_loading_place_valid 
    CHECK (loading_place IN ('PULIVANTHI', 'MATTAPARAI'));

-- Add helpful comment
COMMENT ON COLUMN sales.loading_place IS 
  'REQUIRED: Must match outward_entry.loading_place to determine invoice company address. Valid values: PULIVANTHI, MATTAPARAI';