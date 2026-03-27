-- ============================================
-- COMPREHENSIVE FINANCIAL DATA INTEGRITY SYSTEM
-- ============================================

-- 1. CREATE AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON financial_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON financial_audit_log(timestamp);

-- Enable RLS
ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON financial_audit_log;
CREATE POLICY "Admins can view audit log"
ON financial_audit_log FOR SELECT
USING (has_role(auth.uid()::text, 'admin'::app_role));

DROP POLICY IF EXISTS "System can insert audit log" ON financial_audit_log;
CREATE POLICY "System can insert audit log"
ON financial_audit_log FOR INSERT
WITH CHECK (true);

-- 2. VALIDATION TRIGGER: Ensure reference_id exists
-- ============================================
CREATE OR REPLACE FUNCTION validate_ledger_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'sale' THEN
    IF NOT EXISTS (SELECT 1 FROM sales WHERE id = NEW.reference_id) THEN
      RAISE EXCEPTION 'Invalid reference_id: sale % does not exist', NEW.reference_id;
    END IF;
  ELSIF NEW.transaction_type = 'receipt' THEN
    IF NOT EXISTS (SELECT 1 FROM receipts WHERE id = NEW.reference_id) THEN
      RAISE EXCEPTION 'Invalid reference_id: receipt % does not exist', NEW.reference_id;
    END IF;
  ELSIF NEW.transaction_type = 'credit_note' THEN
    IF NOT EXISTS (SELECT 1 FROM credit_notes WHERE id = NEW.reference_id) THEN
      RAISE EXCEPTION 'Invalid reference_id: credit_note % does not exist', NEW.reference_id;
    END IF;
  ELSIF NEW.transaction_type = 'debit_note' THEN
    IF NOT EXISTS (SELECT 1 FROM debit_notes WHERE id = NEW.reference_id) THEN
      RAISE EXCEPTION 'Invalid reference_id: debit_note % does not exist', NEW.reference_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_ledger_reference_trigger ON customer_ledger;
CREATE TRIGGER validate_ledger_reference_trigger
BEFORE INSERT OR UPDATE OF reference_id ON customer_ledger
FOR EACH ROW
EXECUTE FUNCTION validate_ledger_reference();

-- 3. PREVENT DELETION TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION prevent_sale_deletion_with_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM customer_ledger WHERE reference_id = OLD.id AND transaction_type = 'sale') THEN
    RAISE EXCEPTION 'Cannot delete sale: associated ledger entries exist. Use void/cancel instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_sale_ledger_before_delete ON sales;
CREATE TRIGGER check_sale_ledger_before_delete
BEFORE DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION prevent_sale_deletion_with_ledger();

CREATE OR REPLACE FUNCTION prevent_receipt_deletion_with_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM customer_ledger WHERE reference_id = OLD.id AND transaction_type = 'receipt') THEN
    RAISE EXCEPTION 'Cannot delete receipt: associated ledger entries exist. Use void/cancel instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_receipt_ledger_before_delete ON receipts;
CREATE TRIGGER check_receipt_ledger_before_delete
BEFORE DELETE ON receipts
FOR EACH ROW
EXECUTE FUNCTION prevent_receipt_deletion_with_ledger();

CREATE OR REPLACE FUNCTION prevent_credit_note_deletion_with_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM customer_ledger WHERE reference_id = OLD.id AND transaction_type = 'credit_note') THEN
    RAISE EXCEPTION 'Cannot delete credit note: associated ledger entries exist. Use void/cancel instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_credit_note_ledger_before_delete ON credit_notes;
CREATE TRIGGER check_credit_note_ledger_before_delete
BEFORE DELETE ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION prevent_credit_note_deletion_with_ledger();

CREATE OR REPLACE FUNCTION prevent_debit_note_deletion_with_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM customer_ledger WHERE reference_id = OLD.id AND transaction_type = 'debit_note') THEN
    RAISE EXCEPTION 'Cannot delete debit note: associated ledger entries exist. Use void/cancel instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_debit_note_ledger_before_delete ON debit_notes;
CREATE TRIGGER check_debit_note_ledger_before_delete
BEFORE DELETE ON debit_notes
FOR EACH ROW
EXECUTE FUNCTION prevent_debit_note_deletion_with_ledger();

-- 4. TRANSACTIONAL RPC FUNCTIONS
-- ============================================

-- Create Sale with Ledger (Transactional)
CREATE OR REPLACE FUNCTION create_sale_with_ledger(
  p_sale_data JSONB,
  p_ledger_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_sale_id UUID;
  v_ledger_id UUID;
  v_result JSONB;
BEGIN
  -- Insert sale
  INSERT INTO sales (
    outward_entry_id, customer_id, item_id, quantity, rate, 
    base_amount, gst_amount, total_amount, sale_date, 
    bill_serial_no, irn, created_by
  )
  VALUES (
    (p_sale_data->>'outward_entry_id')::UUID,
    (p_sale_data->>'customer_id')::UUID,
    (p_sale_data->>'item_id')::UUID,
    (p_sale_data->>'quantity')::NUMERIC,
    (p_sale_data->>'rate')::NUMERIC,
    (p_sale_data->>'base_amount')::NUMERIC,
    (p_sale_data->>'gst_amount')::NUMERIC,
    (p_sale_data->>'total_amount')::NUMERIC,
    (p_sale_data->>'sale_date')::DATE,
    p_sale_data->>'bill_serial_no',
    p_sale_data->>'irn',
    p_sale_data->>'created_by'
  )
  RETURNING id INTO v_sale_id;

  -- Insert ledger entry with the sale_id as reference
  INSERT INTO customer_ledger (
    customer_id, transaction_type, reference_id, transaction_date,
    debit_amount, credit_amount, balance, description
  )
  VALUES (
    (p_ledger_data->>'customer_id')::UUID,
    'sale',
    v_sale_id,
    (p_ledger_data->>'transaction_date')::DATE,
    (p_ledger_data->>'debit_amount')::NUMERIC,
    0,
    (p_ledger_data->>'balance')::NUMERIC,
    p_ledger_data->>'description'
  )
  RETURNING id INTO v_ledger_id;

  -- Log to audit trail
  INSERT INTO financial_audit_log (table_name, record_id, operation, new_data, user_id)
  VALUES ('sales', v_sale_id, 'INSERT', p_sale_data, p_sale_data->>'created_by');

  v_result := jsonb_build_object(
    'sale_id', v_sale_id,
    'ledger_id', v_ledger_id,
    'success', true
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Receipt with Ledger (Transactional)
CREATE OR REPLACE FUNCTION create_receipt_with_ledger(
  p_receipt_data JSONB,
  p_ledger_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_receipt_id UUID;
  v_ledger_id UUID;
  v_result JSONB;
BEGIN
  -- Insert receipt
  INSERT INTO receipts (
    customer_id, amount, receipt_date, receipt_no, 
    payment_method, remarks, created_by
  )
  VALUES (
    (p_receipt_data->>'customer_id')::UUID,
    (p_receipt_data->>'amount')::NUMERIC,
    (p_receipt_data->>'receipt_date')::DATE,
    p_receipt_data->>'receipt_no',
    p_receipt_data->>'payment_method',
    p_receipt_data->>'remarks',
    p_receipt_data->>'created_by'
  )
  RETURNING id INTO v_receipt_id;

  -- Insert ledger entry
  INSERT INTO customer_ledger (
    customer_id, transaction_type, reference_id, transaction_date,
    debit_amount, credit_amount, balance, description
  )
  VALUES (
    (p_ledger_data->>'customer_id')::UUID,
    'receipt',
    v_receipt_id,
    (p_ledger_data->>'transaction_date')::DATE,
    0,
    (p_ledger_data->>'credit_amount')::NUMERIC,
    (p_ledger_data->>'balance')::NUMERIC,
    p_ledger_data->>'description'
  )
  RETURNING id INTO v_ledger_id;

  -- Log to audit trail
  INSERT INTO financial_audit_log (table_name, record_id, operation, new_data, user_id)
  VALUES ('receipts', v_receipt_id, 'INSERT', p_receipt_data, p_receipt_data->>'created_by');

  v_result := jsonb_build_object(
    'receipt_id', v_receipt_id,
    'ledger_id', v_ledger_id,
    'success', true
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Credit Note with Ledger (Transactional)
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
    gst_percentage, reason, note_date, created_by
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
    p_note_data->>'created_by'
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

-- Create Debit Note with Ledger (Transactional)
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
    gst_percentage, reason, note_date, created_by
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
    p_note_data->>'created_by'
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

-- 5. HEALTH CHECK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION check_ledger_integrity()
RETURNS TABLE (
  ledger_id UUID,
  transaction_type TEXT,
  reference_id UUID,
  transaction_date DATE,
  debit_amount NUMERIC,
  credit_amount NUMERIC,
  issue TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.id AS ledger_id,
    cl.transaction_type,
    cl.reference_id,
    cl.transaction_date,
    cl.debit_amount,
    cl.credit_amount,
    'Orphaned sale entry' AS issue
  FROM customer_ledger cl
  WHERE cl.transaction_type = 'sale' 
    AND NOT EXISTS (SELECT 1 FROM sales WHERE id = cl.reference_id)
  
  UNION ALL
  
  SELECT 
    cl.id,
    cl.transaction_type,
    cl.reference_id,
    cl.transaction_date,
    cl.debit_amount,
    cl.credit_amount,
    'Orphaned receipt entry'
  FROM customer_ledger cl
  WHERE cl.transaction_type = 'receipt' 
    AND NOT EXISTS (SELECT 1 FROM receipts WHERE id = cl.reference_id)
  
  UNION ALL
  
  SELECT 
    cl.id,
    cl.transaction_type,
    cl.reference_id,
    cl.transaction_date,
    cl.debit_amount,
    cl.credit_amount,
    'Orphaned credit note entry'
  FROM customer_ledger cl
  WHERE cl.transaction_type = 'credit_note' 
    AND NOT EXISTS (SELECT 1 FROM credit_notes WHERE id = cl.reference_id)
  
  UNION ALL
  
  SELECT 
    cl.id,
    cl.transaction_type,
    cl.reference_id,
    cl.transaction_date,
    cl.debit_amount,
    cl.credit_amount,
    'Orphaned debit note entry'
  FROM customer_ledger cl
  WHERE cl.transaction_type = 'debit_note' 
    AND NOT EXISTS (SELECT 1 FROM debit_notes WHERE id = cl.reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;