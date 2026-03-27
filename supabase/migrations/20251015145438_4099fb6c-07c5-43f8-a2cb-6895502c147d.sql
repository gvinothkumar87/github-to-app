-- Harden purchase stock trigger to guarantee non-null running_stock and respect opening stock
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
      description
    ) VALUES (
      NEW.item_id,
      'purchase',
      NEW.id,
      v_qty,
      0,
      COALESCE(v_current_stock, 0) + COALESCE(v_qty, 0),
      NEW.purchase_date,
      'Purchase from ' || (SELECT name_english FROM public.suppliers WHERE id = NEW.supplier_id)
    );

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger
     WHERE transaction_type = 'purchase' AND reference_id = OLD.id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;