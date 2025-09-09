-- Create sales table to track converted outward entries
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outward_entry_id UUID NOT NULL REFERENCES public.outward_entries(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipts table to track payments received from customers
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer ledger table to track all customer transactions
CREATE TABLE public.customer_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'receipt')),
  reference_id UUID NOT NULL, -- sale_id or receipt_id
  debit_amount NUMERIC DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount NUMERIC DEFAULT 0 CHECK (credit_amount >= 0),
  balance NUMERIC NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sales table
CREATE POLICY "Authenticated users can manage sales" 
ON public.sales 
FOR ALL 
TO authenticated 
USING (true);

-- Create RLS policies for receipts table  
CREATE POLICY "Authenticated users can manage receipts" 
ON public.receipts 
FOR ALL 
TO authenticated 
USING (true);

-- Create RLS policies for customer ledger table
CREATE POLICY "Authenticated users can view customer ledger" 
ON public.customer_ledger 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage customer ledger" 
ON public.customer_ledger 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_outward_entry_id ON public.sales(outward_entry_id);
CREATE INDEX idx_receipts_customer_id ON public.receipts(customer_id);
CREATE INDEX idx_customer_ledger_customer_id ON public.customer_ledger(customer_id);
CREATE INDEX idx_customer_ledger_date ON public.customer_ledger(transaction_date);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_ledger_updated_at
BEFORE UPDATE ON public.customer_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate receipt numbers
CREATE OR REPLACE FUNCTION public.generate_receipt_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_no INTEGER;
    receipt_no TEXT;
BEGIN
    -- Get the next receipt number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 'RCP-\\d{8}-(\\d+)') AS INTEGER)), 0) + 1
    INTO next_no
    FROM public.receipts
    WHERE receipt_date = CURRENT_DATE;
    
    -- Generate receipt number with format RCP-YYYYMMDD-001
    receipt_no := 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_no::TEXT, 3, '0');
    
    RETURN receipt_no;
END;
$$;

-- Function to update customer balance in ledger
CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance NUMERIC := 0;
BEGIN
    -- Calculate running balance for this customer
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO current_balance
    FROM public.customer_ledger
    WHERE customer_id = NEW.customer_id
    AND created_at <= NEW.created_at;
    
    -- Update the balance for the new record
    NEW.balance := current_balance;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate balance
CREATE TRIGGER calculate_customer_balance
BEFORE INSERT ON public.customer_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_balance();