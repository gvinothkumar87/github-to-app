-- Update handle_sale_stock function to include mill column
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

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger
     WHERE transaction_type = 'sale' AND reference_id = OLD.id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;