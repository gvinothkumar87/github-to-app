-- Create inward_entries table (mirror of outward_entries for purchases)
-- In purchases: lorry arrives LOADED (full_weight first), then unloaded (empty_weight second)
CREATE TABLE IF NOT EXISTS public.inward_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_no BIGINT GENERATED ALWAYS AS IDENTITY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  lorry_no TEXT NOT NULL,
  driver_mobile TEXT NOT NULL,
  full_weight NUMERIC NOT NULL,
  empty_weight NUMERIC,
  net_weight NUMERIC,
  empty_weight_updated_at TIMESTAMP WITH TIME ZONE,
  empty_weight_updated_by TEXT,
  remarks TEXT,
  loading_place TEXT NOT NULL DEFAULT 'MATTAPARAI',
  weighment_photo_url TEXT,
  empty_weight_photo_url TEXT,
  labour TEXT DEFAULT 'MILL',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add inward_entry_id to purchases table (links purchase to inward entry, like sales.outward_entry_id)
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS inward_entry_id UUID REFERENCES public.inward_entries(id);

-- Add trigger for updated_at on inward_entries
CREATE TRIGGER update_inward_entries_updated_at
BEFORE UPDATE ON public.inward_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on inward_entries
ALTER TABLE public.inward_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inward_entries (same pattern as outward_entries)
CREATE POLICY "Authenticated users can view inward entries"
ON public.inward_entries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert inward entries"
ON public.inward_entries FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update inward entries"
ON public.inward_entries FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete inward entries"
ON public.inward_entries FOR DELETE
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- Add page access entries for new purchase tabs
INSERT INTO public.app_pages (route, name, description)
VALUES 
  ('index:purchase-inward-entries', 'Purchase Inward Entries', 'Record inward entries when lorry arrives with goods'),
  ('index:purchase-empty-weight', 'Purchase Empty Weight', 'Update empty weight after unloading'),
  ('index:purchase-direct', 'Direct Purchase', 'Create purchase without inward entry'),
  ('index:purchase-from-transit', 'Purchase from Transit', 'Convert completed inward entry to purchase'),
  ('index:purchase-list', 'Purchase List', 'View all purchases'),
  ('index:purchase-supplier-ledger', 'Purchase Supplier Ledger', 'View supplier ledger from purchases page')
ON CONFLICT (route) DO NOTHING;
