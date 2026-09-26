-- Archive and remove active records in one transaction, preserving existing RLS
-- and DELETE triggers (including stock and ledger recalculation).
ALTER TABLE public.credit_notes ADD COLUMN IF NOT EXISTS irn text;
ALTER TABLE public.debit_notes ADD COLUMN IF NOT EXISTS irn text;
CREATE TABLE public.cancelled_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_type text NOT NULL CHECK (bill_type IN ('sale', 'debit_note', 'credit_note', 'outward_entry')),
  source_ids uuid[] NOT NULL,
  bill_no text NOT NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 50),
  cancelled_at timestamptz NOT NULL DEFAULT now(),
  cancelled_by uuid NOT NULL DEFAULT auth.uid(),
  snapshot jsonb NOT NULL
);
ALTER TABLE public.cancelled_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read cancellation audit" ON public.cancelled_bills
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Append own cancellation audit" ON public.cancelled_bills
  FOR INSERT TO authenticated WITH CHECK (cancelled_by = (SELECT auth.uid()));
GRANT SELECT, INSERT ON public.cancelled_bills TO authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.cancelled_bills FROM authenticated, anon;
CREATE INDEX cancelled_bills_date_idx ON public.cancelled_bills (cancelled_at DESC);
CREATE INDEX cancelled_bills_number_idx ON public.cancelled_bills (bill_type, bill_no);
CREATE INDEX cancelled_bills_source_idx ON public.cancelled_bills USING gin (source_ids);

CREATE FUNCTION public.cancel_bill(p_type text, p_ids uuid[], p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_table text;
  v_rows jsonb;
  v_ledger jsonb;
  v_stock jsonb;
  v_related jsonb;
  v_id uuid;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(btrim(p_reason)) NOT BETWEEN 1 AND 50 OR p_reason IS NULL THEN
    RAISE EXCEPTION 'Enter a cancellation reason (1–50 characters)';
  END IF;
  v_table := CASE p_type WHEN 'sale' THEN 'sales' WHEN 'debit_note' THEN 'debit_notes'
    WHEN 'credit_note' THEN 'credit_notes' WHEN 'outward_entry' THEN 'outward_entries' END;
  IF v_table IS NULL OR coalesce(cardinality(p_ids), 0) = 0 THEN
    RAISE EXCEPTION 'Invalid bill selection';
  END IF;
  EXECUTE format('SELECT jsonb_agg(to_jsonb(r)) FROM (SELECT * FROM public.%I WHERE id = ANY($1) ORDER BY id FOR UPDATE) r', v_table)
    INTO v_rows USING p_ids;
  IF jsonb_array_length(v_rows) IS DISTINCT FROM cardinality(p_ids) THEN
    RAISE EXCEPTION 'Bill changed or is unavailable. Refresh before cancelling.';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_rows) r
    WHERE (nullif(r->>'irn', '') IS NOT NULL AND coalesce(r->>'einvoice_status', '') <> 'CANCELLED')
       OR (nullif(r->>'eway_bill_no', '') IS NOT NULL AND coalesce(r->>'eway_bill_status', '') <> 'CANCELLED')) THEN
    RAISE EXCEPTION 'Cancel linked e-way bills and e-invoices before cancelling the bill';
  END IF;
  IF p_type = 'outward_entry' AND EXISTS (SELECT 1 FROM sales WHERE outward_entry_id = ANY(p_ids)) THEN
    RAISE EXCEPTION 'Cancel the linked sales bill first';
  END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(l)), '[]') INTO v_ledger
    FROM customer_ledger l WHERE reference_id = ANY(p_ids) AND transaction_type = p_type;
  SELECT coalesce(jsonb_agg(to_jsonb(l)), '[]') INTO v_stock
    FROM stock_ledger l WHERE reference_id = ANY(p_ids) AND transaction_type = p_type;
  SELECT jsonb_build_object(
    'customers', (SELECT jsonb_agg(to_jsonb(c)) FROM customers c WHERE id IN
      (SELECT (r->>'customer_id')::uuid FROM jsonb_array_elements(v_rows) r)),
    'items', (SELECT jsonb_agg(to_jsonb(i)) FROM items i WHERE id IN
      (SELECT (r->>'item_id')::uuid FROM jsonb_array_elements(v_rows) r)),
    'outward_entries', (SELECT jsonb_agg(to_jsonb(o)) FROM outward_entries o WHERE id IN
      (SELECT (r->>'outward_entry_id')::uuid FROM jsonb_array_elements(v_rows) r))) INTO v_related;
  INSERT INTO cancelled_bills (bill_type, source_ids, bill_no, reason, snapshot)
    VALUES (p_type, p_ids, coalesce(v_rows->0->>'bill_serial_no', v_rows->0->>'note_no', v_rows->0->>'serial_no', p_ids[1]::text),
      btrim(p_reason), jsonb_build_object('records', v_rows, 'customer_ledger', v_ledger, 'stock_ledger', v_stock, 'related', v_related))
    RETURNING id INTO v_id;
  DELETE FROM customer_ledger WHERE reference_id = ANY(p_ids) AND transaction_type = p_type;
  IF EXISTS (SELECT 1 FROM customer_ledger WHERE reference_id = ANY(p_ids) AND transaction_type = p_type) THEN
    RAISE EXCEPTION 'Permission denied removing bill ledger';
  END IF;
  EXECUTE format('DELETE FROM public.%I WHERE id = ANY($1)', v_table) USING p_ids;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> cardinality(p_ids) THEN RAISE EXCEPTION 'Permission denied cancelling bill'; END IF;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_bill(text, uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_bill(text, uuid[], text) TO authenticated;

-- Number generators must continue past archived bills, including the latest bill.
CREATE VIEW public.sales_bill_numbers WITH (security_invoker = true) AS
  SELECT bill_serial_no FROM public.sales
  UNION SELECT bill_no FROM public.cancelled_bills WHERE bill_type = 'sale';
CREATE VIEW public.debit_note_numbers WITH (security_invoker = true) AS
  SELECT note_no FROM public.debit_notes
  UNION SELECT bill_no FROM public.cancelled_bills WHERE bill_type = 'debit_note';
CREATE VIEW public.credit_note_numbers WITH (security_invoker = true) AS
  SELECT note_no FROM public.credit_notes
  UNION SELECT bill_no FROM public.cancelled_bills WHERE bill_type = 'credit_note';
GRANT SELECT ON public.sales_bill_numbers, public.debit_note_numbers, public.credit_note_numbers TO authenticated;

-- Reject stale offline re-inserts and manual reuse of a cancelled document number.
CREATE FUNCTION public.prevent_cancelled_bill_reuse() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_type text := CASE TG_TABLE_NAME WHEN 'sales' THEN 'sale' WHEN 'debit_notes' THEN 'debit_note'
    WHEN 'credit_notes' THEN 'credit_note' ELSE 'outward_entry' END;
  v_number text := coalesce(to_jsonb(NEW)->>'bill_serial_no', to_jsonb(NEW)->>'note_no', to_jsonb(NEW)->>'serial_no');
  v_old_number text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_number := coalesce(to_jsonb(OLD)->>'bill_serial_no', to_jsonb(OLD)->>'note_no', to_jsonb(OLD)->>'serial_no');
  END IF;
  IF EXISTS (SELECT 1 FROM cancelled_bills WHERE bill_type = v_type AND source_ids @> ARRAY[NEW.id]) OR
    ((TG_OP = 'INSERT' OR v_number IS DISTINCT FROM v_old_number) AND EXISTS
      (SELECT 1 FROM cancelled_bills WHERE bill_type = v_type AND bill_no = v_number)) THEN
    RAISE EXCEPTION 'This bill or bill number was cancelled and is reserved for audit. Use a new bill number.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER prevent_cancelled_bill_reuse BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.prevent_cancelled_bill_reuse();
CREATE TRIGGER prevent_cancelled_bill_reuse BEFORE INSERT OR UPDATE ON public.debit_notes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_cancelled_bill_reuse();
CREATE TRIGGER prevent_cancelled_bill_reuse BEFORE INSERT OR UPDATE ON public.credit_notes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_cancelled_bill_reuse();
CREATE TRIGGER prevent_cancelled_bill_reuse BEFORE INSERT OR UPDATE ON public.outward_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_cancelled_bill_reuse();
