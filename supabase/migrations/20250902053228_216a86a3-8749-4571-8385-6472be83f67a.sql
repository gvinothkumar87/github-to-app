-- Add multilingual support to existing customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS name_english text,
ADD COLUMN IF NOT EXISTS name_tamil text,
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS address_english text,
ADD COLUMN IF NOT EXISTS address_tamil text;

-- Update existing customers to use name_english
UPDATE public.customers 
SET name_english = name 
WHERE name_english IS NULL AND name IS NOT NULL;

-- Create unique constraint on code if it doesn't exist
ALTER TABLE public.customers 
ADD CONSTRAINT customers_code_unique UNIQUE (code);

-- Create items table with multilingual support
CREATE TABLE IF NOT EXISTS public.items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_english text NOT NULL,
  name_tamil text,
  code text UNIQUE NOT NULL,
  unit text NOT NULL DEFAULT 'KG',
  description_english text,
  description_tamil text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create outward entries table
CREATE TABLE IF NOT EXISTS public.outward_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_no serial UNIQUE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  item_id uuid NOT NULL REFERENCES public.items(id),
  lorry_no text NOT NULL,
  driver_mobile text NOT NULL,
  empty_weight numeric(10,2) NOT NULL DEFAULT 0.00,
  load_weight numeric(10,2) DEFAULT NULL,
  net_weight numeric(10,2) GENERATED ALWAYS AS (COALESCE(load_weight, 0) - empty_weight) STORED,
  load_weight_updated_at timestamp with time zone,
  load_weight_updated_by uuid,
  remarks text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security on new tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outward_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for items
CREATE POLICY "Authenticated users can manage items" 
ON public.items 
FOR ALL 
USING (true);

-- Create policies for outward entries
CREATE POLICY "Authenticated users can manage outward entries" 
ON public.outward_entries 
FOR ALL 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outward_entries_updated_at
BEFORE UPDATE ON public.outward_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outward_entries_customer_id ON public.outward_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_outward_entries_item_id ON public.outward_entries(item_id);
CREATE INDEX IF NOT EXISTS idx_outward_entries_entry_date ON public.outward_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_outward_entries_serial_no ON public.outward_entries(serial_no);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_items_code ON public.items(code);