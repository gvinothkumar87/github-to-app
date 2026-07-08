-- Migration to allow editing customer and item in sales and purchases

-- 1. Update update_sale_with_ledger RPC function
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
    customer_id = COALESCE((p_sale_data->>'customer_id')::UUID, customer_id),
    item_id = COALESCE((p_sale_data->>'item_id')::UUID, item_id),
    rate = COALESCE((p_sale_data->>'rate')::NUMERIC, rate),
    total_amount = COALESCE((p_sale_data->>'total_amount')::NUMERIC, total_amount),
    base_amount = COALESCE((p_sale_data->>'base_amount')::NUMERIC, base_amount),
    gst_amount = COALESCE((p_sale_data->>'gst_amount')::NUMERIC, gst_amount),
    sale_date = COALESCE((p_sale_data->>'sale_date')::DATE, sale_date),
    bill_serial_no = COALESCE(p_sale_data->>'bill_serial_no', bill_serial_no),
    irn = COALESCE(p_sale_data->>'irn', irn),
    updated_at = now()
  WHERE id = p_sale_id;
  
  -- Update outward entry if it exists
  IF v_old_sale.outward_entry_id IS NOT NULL THEN
    UPDATE public.outward_entries
    SET
      customer_id = COALESCE((p_sale_data->>'customer_id')::UUID, customer_id),
      item_id = COALESCE((p_sale_data->>'item_id')::UUID, item_id),
      empty_weight = CASE WHEN p_outward_entry_data IS NOT NULL THEN COALESCE((p_outward_entry_data->>'empty_weight')::NUMERIC, empty_weight) ELSE empty_weight END,
      load_weight = CASE WHEN p_outward_entry_data IS NOT NULL THEN COALESCE((p_outward_entry_data->>'load_weight')::NUMERIC, load_weight) ELSE load_weight END,
      updated_at = now()
    WHERE id = v_old_sale.outward_entry_id;
  END IF;
  
  -- Update customer ledger entry
  UPDATE public.customer_ledger
  SET
    customer_id = COALESCE((p_sale_data->>'customer_id')::UUID, customer_id),
    debit_amount = COALESCE((p_sale_data->>'total_amount')::NUMERIC, debit_amount),
    transaction_date = COALESCE((p_sale_data->>'sale_date')::DATE, transaction_date),
    updated_at = now()
  WHERE reference_id = p_sale_id AND transaction_type = 'sale'
  RETURNING id INTO v_ledger_id;
  
  -- Recalculate customer ledger balances for old customer
  PERFORM public.recalculate_customer_ledger_balances(
    v_old_sale.customer_id,
    LEAST(
      COALESCE((p_sale_data->>'sale_date')::DATE, v_old_sale.sale_date),
      v_old_sale.sale_date
    )
  );
  
  -- Recalculate customer ledger balances for new customer if it changed
  IF (p_sale_data->>'customer_id') IS NOT NULL AND (p_sale_data->>'customer_id')::UUID <> v_old_sale.customer_id THEN
    PERFORM public.recalculate_customer_ledger_balances(
      (p_sale_data->>'customer_id')::UUID,
      COALESCE((p_sale_data->>'sale_date')::DATE, v_old_sale.sale_date)
    );
  END IF;
  
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
    'sale',
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

-- 2. Update handle_purchase_ledger function to support UPDATE
CREATE OR REPLACE FUNCTION public.handle_purchase_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert into supplier ledger as credit (increases supplier credit)
    INSERT INTO public.supplier_ledger (
      supplier_id,
      transaction_type,
      reference_id,
      debit_amount,
      credit_amount,
      transaction_date,
      description
    ) VALUES (
      NEW.supplier_id,
      'purchase',
      NEW.id,
      0,
      NEW.total_amount,
      NEW.purchase_date,
      'Purchase Bill ' || COALESCE(NEW.bill_serial_no, NEW.id::text)
    );
    
    -- Update supplier balance
    UPDATE public.supplier_ledger 
    SET balance = (
      SELECT COALESCE(SUM(credit_amount - debit_amount), 0)
      FROM public.supplier_ledger 
      WHERE supplier_id = NEW.supplier_id
    )
    WHERE supplier_id = NEW.supplier_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update supplier ledger entry
    UPDATE public.supplier_ledger
    SET
      supplier_id = NEW.supplier_id,
      credit_amount = NEW.total_amount,
      transaction_date = NEW.purchase_date,
      description = 'Purchase Bill ' || COALESCE(NEW.bill_serial_no, NEW.id::text),
      updated_at = now()
    WHERE transaction_type = 'purchase' AND reference_id = NEW.id;

    -- Update old supplier balance
    UPDATE public.supplier_ledger 
    SET balance = (
      SELECT COALESCE(SUM(credit_amount - debit_amount), 0)
      FROM public.supplier_ledger 
      WHERE supplier_id = OLD.supplier_id
    )
    WHERE supplier_id = OLD.supplier_id;

    -- Update new supplier balance if changed
    IF NEW.supplier_id <> OLD.supplier_id THEN
      UPDATE public.supplier_ledger 
      SET balance = (
        SELECT COALESCE(SUM(credit_amount - debit_amount), 0)
        FROM public.supplier_ledger 
        WHERE supplier_id = NEW.supplier_id
      )
      WHERE supplier_id = NEW.supplier_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from supplier ledger
    DELETE FROM public.supplier_ledger 
    WHERE transaction_type = 'purchase' AND reference_id = OLD.id;
    
    -- Update supplier balance
    UPDATE public.supplier_ledger 
    SET balance = (
      SELECT COALESCE(SUM(credit_amount - debit_amount), 0)
      FROM public.supplier_ledger 
      WHERE supplier_id = OLD.supplier_id
    )
    WHERE supplier_id = OLD.supplier_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate handle_purchase_ledger_trigger to trigger on UPDATE
DROP TRIGGER IF EXISTS handle_purchase_ledger_trigger ON public.purchases;
CREATE TRIGGER handle_purchase_ledger_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.handle_purchase_ledger();


-- 3. Update handle_purchase_stock function to support UPDATE
CREATE OR REPLACE FUNCTION public.handle_purchase_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_current_stock NUMERIC;
  v_opening_stock NUMERIC := 0;
  v_has_entries BOOLEAN := false;
  v_qty NUMERIC := COALESCE(NEW.quantity, 0);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Opening stock from items
    SELECT COALESCE(opening_stock, 0)
      INTO v_opening_stock
      FROM public.items
     WHERE id = NEW.item_id;

    -- Latest running stock if any entry exists
    SELECT EXISTS (
      SELECT 1 FROM public.stock_ledger WHERE item_id = NEW.item_id
    ) INTO v_has_entries;

    IF v_has_entries THEN
      SELECT running_stock
        INTO v_current_stock
        FROM public.stock_ledger
       WHERE item_id = NEW.item_id
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT 1;
    ELSE
      v_current_stock := v_opening_stock;
    END IF;

    -- Safety fallback
    v_current_stock := COALESCE(v_current_stock, v_opening_stock, 0);

    INSERT INTO public.stock_ledger (
      item_id,
      transaction_type,
      reference_id,
      quantity_in,
      quantity_out,
      running_stock,
      transaction_date,
      description,
      mill
    ) VALUES (
      NEW.item_id,
      'purchase',
      NEW.id,
      v_qty,
      0,
      COALESCE(v_current_stock, 0) + COALESCE(v_qty, 0),
      NEW.purchase_date,
      'Purchase from ' || (SELECT name_english FROM public.suppliers WHERE id = NEW.supplier_id),
      NEW.mill
    );

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.stock_ledger
    SET
      item_id = NEW.item_id,
      quantity_in = v_qty,
      transaction_date = NEW.purchase_date,
      description = 'Purchase from ' || (SELECT name_english FROM public.suppliers WHERE id = NEW.supplier_id),
      mill = NEW.mill,
      updated_at = now()
    WHERE transaction_type = 'purchase' AND reference_id = NEW.id;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger
     WHERE transaction_type = 'purchase' AND reference_id = OLD.id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate handle_purchase_stock_trigger to trigger on UPDATE
DROP TRIGGER IF EXISTS handle_purchase_stock_trigger ON public.purchases;
CREATE TRIGGER handle_purchase_stock_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.handle_purchase_stock();


-- 4. Update handle_sale_stock function to support UPDATE
CREATE OR REPLACE FUNCTION public.handle_sale_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_current_stock NUMERIC;
  v_opening_stock NUMERIC := 0;
  v_has_entries BOOLEAN := false;
  v_qty NUMERIC := COALESCE(NEW.quantity, 0);
  v_mill TEXT;
  v_outward_entry_mill TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get mill from outward_entry if available, otherwise default to MATTAPARAI
    IF NEW.outward_entry_id IS NOT NULL THEN
      SELECT loading_place INTO v_outward_entry_mill
        FROM public.outward_entries
       WHERE id = NEW.outward_entry_id;
      v_mill := COALESCE(v_outward_entry_mill, 'MATTAPARAI');
    ELSE
      v_mill := 'MATTAPARAI';
    END IF;

    -- Opening stock from items
    SELECT COALESCE(opening_stock, 0)
      INTO v_opening_stock
      FROM public.items
     WHERE id = NEW.item_id;

    -- Latest running stock for this item AND mill
    SELECT EXISTS (
      SELECT 1 FROM public.stock_ledger 
      WHERE item_id = NEW.item_id 
        AND mill = v_mill
    ) INTO v_has_entries;

    IF v_has_entries THEN
      SELECT running_stock
        INTO v_current_stock
        FROM public.stock_ledger
       WHERE item_id = NEW.item_id
         AND mill = v_mill
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT 1;
    ELSE
      v_current_stock := v_opening_stock;
    END IF;

    -- Safety fallback
    v_current_stock := COALESCE(v_current_stock, v_opening_stock, 0);

    INSERT INTO public.stock_ledger (
      item_id,
      transaction_type,
      reference_id,
      quantity_in,
      quantity_out,
      running_stock,
      transaction_date,
      description,
      mill
    ) VALUES (
      NEW.item_id,
      'sale',
      NEW.id,
      0,
      v_qty,
      COALESCE(v_current_stock, 0) - COALESCE(v_qty, 0),
      NEW.sale_date,
      'Sale to ' || (SELECT name_english FROM public.customers WHERE id = NEW.customer_id),
      v_mill
    );

  ELSIF TG_OP = 'UPDATE' THEN
    -- Get mill from outward_entry if available, otherwise default to MATTAPARAI
    IF NEW.outward_entry_id IS NOT NULL THEN
      SELECT loading_place INTO v_outward_entry_mill
        FROM public.outward_entries
       WHERE id = NEW.outward_entry_id;
      v_mill := COALESCE(v_outward_entry_mill, 'MATTAPARAI');
    ELSE
      v_mill := 'MATTAPARAI';
    END IF;

    UPDATE public.stock_ledger
    SET
      item_id = NEW.item_id,
      quantity_out = v_qty,
      transaction_date = NEW.sale_date,
      description = 'Sale to ' || (SELECT name_english FROM public.customers WHERE id = NEW.customer_id),
      mill = v_mill,
      updated_at = now()
    WHERE transaction_type = 'sale' AND reference_id = NEW.id;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger
     WHERE transaction_type = 'sale' AND reference_id = OLD.id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate handle_sale_stock_trigger to trigger on UPDATE
DROP TRIGGER IF EXISTS handle_sale_stock_trigger ON public.sales;
CREATE TRIGGER handle_sale_stock_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_sale_stock();
