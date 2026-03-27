-- Add opening_stock column to items table
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS opening_stock NUMERIC DEFAULT 0;

-- Update the handle_purchase_stock function to consider opening stock
CREATE OR REPLACE FUNCTION public.handle_purchase_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_current_stock NUMERIC := 0;
  v_opening_stock NUMERIC := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get opening stock from items table
    SELECT COALESCE(opening_stock, 0) INTO v_opening_stock
    FROM public.items
    WHERE id = NEW.item_id;
    
    -- Get current stock (if any transactions exist)
    SELECT COALESCE(running_stock, 0) INTO v_current_stock
    FROM public.stock_ledger
    WHERE item_id = NEW.item_id
    ORDER BY transaction_date DESC, created_at DESC
    LIMIT 1;
    
    -- If no stock ledger entries exist, use opening stock as base
    IF v_current_stock = 0 AND NOT EXISTS (
      SELECT 1 FROM public.stock_ledger WHERE item_id = NEW.item_id
    ) THEN
      v_current_stock := v_opening_stock;
    END IF;
    
    -- Insert stock ledger entry with proper null handling
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
      COALESCE(NEW.quantity, 0),
      0,
      v_current_stock + COALESCE(NEW.quantity, 0),
      NEW.purchase_date,
      'Purchase from ' || (SELECT name_english FROM public.suppliers WHERE id = NEW.supplier_id)
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove stock ledger entry
    DELETE FROM public.stock_ledger 
    WHERE transaction_type = 'purchase' AND reference_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;