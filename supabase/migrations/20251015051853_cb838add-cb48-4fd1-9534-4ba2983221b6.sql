-- Create suppliers table (similar to customers)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_english TEXT NOT NULL,
  name_tamil TEXT,
  code TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address_english TEXT,
  address_tamil TEXT,
  gstin TEXT,
  pin_code TEXT,
  state_code TEXT DEFAULT '33',
  place_of_supply TEXT DEFAULT '33',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table (similar to sales)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  bill_serial_no TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_ledger table (similar to customer_ledger)
CREATE TABLE IF NOT EXISTS public.supplier_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  transaction_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  debit_amount NUMERIC NOT NULL DEFAULT 0,
  credit_amount NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_ledger table for item-wise stock tracking
CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id),
  transaction_type TEXT NOT NULL, -- 'purchase', 'sale', 'opening_stock'
  reference_id UUID,
  quantity_in NUMERIC NOT NULL DEFAULT 0,
  quantity_out NUMERIC NOT NULL DEFAULT 0,
  running_stock NUMERIC NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add trigger for updated_at on suppliers
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on purchases
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on supplier_ledger
CREATE TRIGGER update_supplier_ledger_updated_at
BEFORE UPDATE ON public.supplier_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on stock_ledger
CREATE TRIGGER update_stock_ledger_updated_at
BEFORE UPDATE ON public.stock_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all new tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
ON public.suppliers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- RLS Policies for purchases
CREATE POLICY "Authenticated users can view purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update purchases"
ON public.purchases FOR UPDATE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role))
WITH CHECK (has_role(auth.uid()::text, 'admin'::app_role));

CREATE POLICY "Admins can delete purchases"
ON public.purchases FOR DELETE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- RLS Policies for supplier_ledger
CREATE POLICY "Authenticated users can view supplier ledger"
ON public.supplier_ledger FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert supplier ledger entries"
ON public.supplier_ledger FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update supplier ledger"
ON public.supplier_ledger FOR UPDATE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role))
WITH CHECK (has_role(auth.uid()::text, 'admin'::app_role));

CREATE POLICY "Admins can delete supplier ledger entries"
ON public.supplier_ledger FOR DELETE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- RLS Policies for stock_ledger
CREATE POLICY "Authenticated users can view stock ledger"
ON public.stock_ledger FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert stock ledger entries"
ON public.stock_ledger FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update stock ledger"
ON public.stock_ledger FOR UPDATE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role))
WITH CHECK (has_role(auth.uid()::text, 'admin'::app_role));

CREATE POLICY "Admins can delete stock ledger entries"
ON public.stock_ledger FOR DELETE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- Create trigger function to update supplier ledger on purchase
CREATE OR REPLACE FUNCTION handle_purchase_ledger()
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

-- Create trigger for purchase ledger
CREATE TRIGGER handle_purchase_ledger_trigger
AFTER INSERT OR DELETE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION handle_purchase_ledger();

-- Create trigger function to update stock ledger on purchase
CREATE OR REPLACE FUNCTION handle_purchase_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock NUMERIC := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get current stock
    SELECT COALESCE(running_stock, 0) INTO v_current_stock
    FROM public.stock_ledger
    WHERE item_id = NEW.item_id
    ORDER BY transaction_date DESC, created_at DESC
    LIMIT 1;
    
    -- Insert stock ledger entry
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
      NEW.quantity,
      0,
      v_current_stock + NEW.quantity,
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
$$ LANGUAGE plpgsql;

-- Create trigger for purchase stock
CREATE TRIGGER handle_purchase_stock_trigger
AFTER INSERT OR DELETE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION handle_purchase_stock();

-- Create trigger function to update stock ledger on sale
CREATE OR REPLACE FUNCTION handle_sale_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock NUMERIC := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get current stock
    SELECT COALESCE(running_stock, 0) INTO v_current_stock
    FROM public.stock_ledger
    WHERE item_id = NEW.item_id
    ORDER BY transaction_date DESC, created_at DESC
    LIMIT 1;
    
    -- Insert stock ledger entry
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
      'sale',
      NEW.id,
      0,
      NEW.quantity,
      v_current_stock - NEW.quantity,
      NEW.sale_date,
      'Sale to ' || (SELECT name_english FROM public.customers WHERE id = NEW.customer_id)
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove stock ledger entry
    DELETE FROM public.stock_ledger 
    WHERE transaction_type = 'sale' AND reference_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sale stock
CREATE TRIGGER handle_sale_stock_trigger
AFTER INSERT OR DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION handle_sale_stock();