-- Add multilingual support to existing customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS name_tamil text,
ADD COLUMN IF NOT EXISTS address_tamil text;

-- Update existing items to be called items instead of products for consistency
-- Add multilingual support to existing items table (using existing products table)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS name_tamil text,
ADD COLUMN IF NOT EXISTS description_tamil text;

-- Create outward entries table
CREATE TABLE IF NOT EXISTS public.outward_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_no serial UNIQUE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  item_id uuid NOT NULL REFERENCES public.products(id),
  lorry_no text NOT NULL,
  driver_mobile text NOT NULL,
  empty_weight numeric(10,2) NOT NULL DEFAULT 0.00,
  load_weight numeric(10,2) DEFAULT NULL,
  net_weight numeric(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN load_weight IS NOT NULL THEN load_weight - empty_weight 
      ELSE NULL 
    END
  ) STORED,
  load_weight_updated_at timestamp with time zone,
  load_weight_updated_by uuid,
  remarks text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security for outward entries
ALTER TABLE public.outward_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for outward entries
CREATE POLICY "Authenticated users can manage outward entries" 
ON public.outward_entries 
FOR ALL 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_outward_entries_updated_at
BEFORE UPDATE ON public.outward_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outward_entries_customer_id ON public.outward_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_outward_entries_item_id ON public.outward_entries(item_id);
CREATE INDEX IF NOT EXISTS idx_outward_entries_entry_date ON public.outward_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_outward_entries_serial_no ON public.outward_entries(serial_no);