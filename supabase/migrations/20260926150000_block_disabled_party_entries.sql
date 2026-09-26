-- Enforce at the source transaction tables, including SECURITY DEFINER RPCs and
-- offline sync. Do not filter SELECT policies: historical records stay readable.
CREATE OR REPLACE FUNCTION public.require_active_transaction_party()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_party_id uuid;
  v_active boolean;
  v_new jsonb := to_jsonb(NEW);
  v_metadata text[] := ARRAY['updated_at', 'einvoice_status', 'eway_bill_status',
    'irn', 'ack_no', 'ack_date', 'signed_invoice', 'signed_qrcode',
    'eway_bill_no', 'eway_bill_date', 'eway_bill_valid_upto'];
BEGIN
  -- Portal status synchronization/cancellation of old bills must remain possible.
  IF TG_OP = 'UPDATE' AND (v_new - v_metadata) = (to_jsonb(OLD) - v_metadata) THEN
    RETURN NEW;
  END IF;
  v_party_id := (v_new->>TG_ARGV[1])::uuid;
  IF v_party_id IS NULL THEN RETURN NEW; END IF;
  -- Share lock serializes entry creation with a concurrent Disable operation.
  EXECUTE format('SELECT is_active FROM public.%I WHERE id = $1 FOR SHARE', TG_ARGV[0])
    INTO v_active USING v_party_id;
  IF v_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION '% is disabled or unavailable. Select an active % to save this entry.', TG_ARGV[2], lower(TG_ARGV[2]);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.require_active_transaction_party() FROM PUBLIC;

CREATE TRIGGER require_active_party BEFORE INSERT OR UPDATE ON public.outward_entries
  FOR EACH ROW EXECUTE FUNCTION public.require_active_transaction_party('customers', 'customer_id', 'Customer');
CREATE TRIGGER require_active_party BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.require_active_transaction_party('customers', 'customer_id', 'Customer');
CREATE TRIGGER require_active_party BEFORE INSERT OR UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.require_active_transaction_party('customers', 'customer_id', 'Customer');
CREATE TRIGGER require_active_party BEFORE INSERT OR UPDATE ON public.debit_notes
  FOR EACH ROW EXECUTE FUNCTION public.require_active_transaction_party('customers', 'customer_id', 'Customer');
CREATE TRIGGER require_active_party BEFORE INSERT OR UPDATE ON public.credit_notes
  FOR EACH ROW EXECUTE FUNCTION public.require_active_transaction_party('customers', 'customer_id', 'Customer');
CREATE TRIGGER require_active_party BEFORE INSERT OR UPDATE ON public.inward_entries
  FOR EACH ROW EXECUTE FUNCTION public.require_active_transaction_party('suppliers', 'supplier_id', 'Supplier');
CREATE TRIGGER require_active_party BEFORE INSERT OR UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.require_active_transaction_party('suppliers', 'supplier_id', 'Supplier');
