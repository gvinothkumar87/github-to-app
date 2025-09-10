-- Add loading_place column to outward_entries table
ALTER TABLE public.outward_entries 
ADD COLUMN loading_place TEXT NOT NULL DEFAULT 'PULIVANTHI' 
CHECK (loading_place IN ('PULIVANTHI', 'MATTAPARAI'));