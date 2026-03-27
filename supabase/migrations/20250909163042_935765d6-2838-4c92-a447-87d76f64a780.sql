-- Create customers table for transit operations
CREATE TABLE public.customers (
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
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create items table for product catalog
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_english TEXT NOT NULL,
  name_tamil TEXT,
  code TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'KG',
  description_english TEXT,
  description_tamil TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create outward_entries table for shipment records
CREATE TABLE public.outward_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_no SERIAL NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  lorry_no TEXT NOT NULL,
  driver_mobile TEXT NOT NULL,
  empty_weight NUMERIC(10,2) NOT NULL,
  load_weight NUMERIC(10,2),
  net_weight NUMERIC(10,2),
  load_weight_updated_at TIMESTAMP WITH TIME ZONE,
  load_weight_updated_by TEXT,
  remarks TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table for completed shipments
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outward_entry_id UUID NOT NULL REFERENCES public.outward_entries(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity NUMERIC(10,2) NOT NULL,
  rate NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipts table for payment tracking
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  amount NUMERIC(10,2) NOT NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  remarks TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_ledger table for customer account tracking
CREATE TABLE public.customer_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'receipt')),
  reference_id UUID NOT NULL,
  debit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_ledger_mapping table to link customers with main ledgers
CREATE TABLE public.customer_ledger_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  ledger_id UUID NOT NULL REFERENCES public.ledgers(id),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, ledger_id)
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outward_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_ledger_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE USING (true);

-- Create RLS policies for items
CREATE POLICY "Authenticated users can view items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create items" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update items" ON public.items FOR UPDATE USING (true);

-- Create RLS policies for outward_entries
CREATE POLICY "Authenticated users can view outward entries" ON public.outward_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create outward entries" ON public.outward_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update outward entries" ON public.outward_entries FOR UPDATE USING (true);

-- Create RLS policies for sales
CREATE POLICY "Authenticated users can view sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update sales" ON public.sales FOR UPDATE USING (true);

-- Create RLS policies for receipts
CREATE POLICY "Authenticated users can view receipts" ON public.receipts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create receipts" ON public.receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update receipts" ON public.receipts FOR UPDATE USING (true);

-- Create RLS policies for customer_ledger
CREATE POLICY "Authenticated users can view customer ledger" ON public.customer_ledger FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create customer ledger" ON public.customer_ledger FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update customer ledger" ON public.customer_ledger FOR UPDATE USING (true);

-- Create RLS policies for customer_ledger_mapping
CREATE POLICY "Authenticated users can view customer ledger mapping" ON public.customer_ledger_mapping FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create customer ledger mapping" ON public.customer_ledger_mapping FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update customer ledger mapping" ON public.customer_ledger_mapping FOR UPDATE USING (true);

-- Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION public.generate_receipt_no()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  receipt_no TEXT;
BEGIN
  -- Get the next receipt number
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.receipts
  WHERE receipt_no ~ '^RCP[0-9]+$';
  
  -- Format as RCP000001, RCP000002, etc.
  receipt_no := 'RCP' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN receipt_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update net weight when load weight is set
CREATE OR REPLACE FUNCTION public.update_net_weight()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate net weight when load weight is updated
  IF NEW.load_weight IS NOT NULL AND OLD.load_weight IS DISTINCT FROM NEW.load_weight THEN
    NEW.net_weight := NEW.load_weight - NEW.empty_weight;
    NEW.load_weight_updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for net weight calculation
CREATE TRIGGER trigger_update_net_weight
  BEFORE UPDATE ON public.outward_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_net_weight();

-- Add updated_at triggers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outward_entries_updated_at
  BEFORE UPDATE ON public.outward_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER update_customer_ledger_mapping_updated_at
  BEFORE UPDATE ON public.customer_ledger_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();