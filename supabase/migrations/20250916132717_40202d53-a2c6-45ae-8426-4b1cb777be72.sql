-- Add unit_weight column to items table
ALTER TABLE public.items 
ADD COLUMN unit_weight numeric NOT NULL DEFAULT 1;