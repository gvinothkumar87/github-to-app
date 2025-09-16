-- Add IRN field to sales table
ALTER TABLE public.sales 
ADD COLUMN irn TEXT;