-- Add item_id column to debit_notes and credit_notes tables for HSN tracking
ALTER TABLE public.debit_notes 
ADD COLUMN item_id uuid REFERENCES public.items(id);

ALTER TABLE public.credit_notes 
ADD COLUMN item_id uuid REFERENCES public.items(id);