-- Update create_credit_note_with_ledger to include mill
CREATE OR REPLACE FUNCTION create_credit_note_with_ledger(
  p_note_data JSONB,
  p_ledger_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_note_id UUID;
  v_ledger_id UUID;
  v_result JSONB;
BEGIN
  -- Insert credit note
  INSERT INTO credit_notes (
    customer_id, item_id, note_no, reference_bill_no, amount,
    gst_percentage, reason, note_date, created_by, mill
  )
  VALUES (
    (p_note_data->>'customer_id')::UUID,
    (p_note_data->>'item_id')::UUID,
    p_note_data->>'note_no',
    p_note_data->>'reference_bill_no',
    (p_note_data->>'amount')::NUMERIC,
    (p_note_data->>'gst_percentage')::NUMERIC,
    p_note_data->>'reason',
    (p_note_data->>'note_date')::DATE,
    p_note_data->>'created_by',
    p_note_data->>'mill'
  )
  RETURNING id INTO v_note_id;

  -- Insert ledger entry
  INSERT INTO customer_ledger (
    customer_id, transaction_type, reference_id, transaction_date,
    debit_amount, credit_amount, balance, description
  )
  VALUES (
    (p_ledger_data->>'customer_id')::UUID,
    'credit_note',
    v_note_id,
    (p_ledger_data->>'transaction_date')::DATE,
    0,
    (p_ledger_data->>'credit_amount')::NUMERIC,
    (p_ledger_data->>'balance')::NUMERIC,
    p_ledger_data->>'description'
  )
  RETURNING id INTO v_ledger_id;

  -- Log to audit trail
  INSERT INTO financial_audit_log (table_name, record_id, operation, new_data, user_id)
  VALUES ('credit_notes', v_note_id, 'INSERT', p_note_data, p_note_data->>'created_by');

  v_result := jsonb_build_object(
    'note_id', v_note_id,
    'ledger_id', v_ledger_id,
    'success', true
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_debit_note_with_ledger to include mill
CREATE OR REPLACE FUNCTION create_debit_note_with_ledger(
  p_note_data JSONB,
  p_ledger_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_note_id UUID;
  v_ledger_id UUID;
  v_result JSONB;
BEGIN
  -- Insert debit note
  INSERT INTO debit_notes (
    customer_id, item_id, note_no, reference_bill_no, amount,
    gst_percentage, reason, note_date, created_by, mill
  )
  VALUES (
    (p_note_data->>'customer_id')::UUID,
    (p_note_data->>'item_id')::UUID,
    p_note_data->>'note_no',
    p_note_data->>'reference_bill_no',
    (p_note_data->>'amount')::NUMERIC,
    (p_note_data->>'gst_percentage')::NUMERIC,
    p_note_data->>'reason',
    (p_note_data->>'note_date')::DATE,
    p_note_data->>'created_by',
    p_note_data->>'mill'
  )
  RETURNING id INTO v_note_id;

  -- Insert ledger entry
  INSERT INTO customer_ledger (
    customer_id, transaction_type, reference_id, transaction_date,
    debit_amount, credit_amount, balance, description
  )
  VALUES (
    (p_ledger_data->>'customer_id')::UUID,
    'debit_note',
    v_note_id,
    (p_ledger_data->>'transaction_date')::DATE,
    (p_ledger_data->>'debit_amount')::NUMERIC,
    0,
    (p_ledger_data->>'balance')::NUMERIC,
    p_ledger_data->>'description'
  )
  RETURNING id INTO v_ledger_id;

  -- Log to audit trail
  INSERT INTO financial_audit_log (table_name, record_id, operation, new_data, user_id)
  VALUES ('debit_notes', v_note_id, 'INSERT', p_note_data, p_note_data->>'created_by');

  v_result := jsonb_build_object(
    'note_id', v_note_id,
    'ledger_id', v_ledger_id,
    'success', true
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
