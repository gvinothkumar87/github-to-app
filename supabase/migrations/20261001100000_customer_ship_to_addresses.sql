CREATE TABLE IF NOT EXISTS public.customer_ship_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label text NOT NULL,
  name text,
  address_english text NOT NULL,
  address_tamil text,
  pin_code text,
  state_code text,
  place_of_supply text,
  gstin text,
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS ship_to_address_id uuid REFERENCES public.customer_ship_addresses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_ship_addresses_customer_id
  ON public.customer_ship_addresses(customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_ship_addresses_one_default
  ON public.customer_ship_addresses(customer_id)
  WHERE is_default = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_sales_ship_to_address_id
  ON public.sales(ship_to_address_id);

CREATE OR REPLACE FUNCTION public.update_customer_ship_addresses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_customer_ship_addresses_updated_at ON public.customer_ship_addresses;
CREATE TRIGGER update_customer_ship_addresses_updated_at
  BEFORE UPDATE ON public.customer_ship_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_ship_addresses_updated_at();

ALTER TABLE public.customer_ship_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view customer ship addresses" ON public.customer_ship_addresses;
CREATE POLICY "Authenticated users can view customer ship addresses"
  ON public.customer_ship_addresses
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create customer ship addresses" ON public.customer_ship_addresses;
CREATE POLICY "Authenticated users can create customer ship addresses"
  ON public.customer_ship_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customer ship addresses" ON public.customer_ship_addresses;
CREATE POLICY "Authenticated users can update customer ship addresses"
  ON public.customer_ship_addresses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete customer ship addresses" ON public.customer_ship_addresses;
CREATE POLICY "Authenticated users can delete customer ship addresses"
  ON public.customer_ship_addresses
  FOR DELETE
  TO authenticated
  USING (true);


-- Keep the sales creation RPC aware of selected Ship To addresses.
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
  IF p_sale_data->>'loading_place' IS NULL OR p_sale_data->>'loading_place' = '' THEN
    RAISE EXCEPTION 'loading_place is required for creating sales';
  END IF;

  INSERT INTO public.sales (
    outward_entry_id,
    customer_id,
    ship_to_address_id,
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
    NULLIF(p_sale_data->>'outward_entry_id', '')::UUID,
    (p_sale_data->>'customer_id')::UUID,
    NULLIF(p_sale_data->>'ship_to_address_id', '')::UUID,
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
