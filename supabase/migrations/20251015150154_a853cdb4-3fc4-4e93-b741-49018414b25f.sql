-- Make outward_entry_id nullable in sales table for direct sales support
ALTER TABLE public.sales 
ALTER COLUMN outward_entry_id DROP NOT NULL;