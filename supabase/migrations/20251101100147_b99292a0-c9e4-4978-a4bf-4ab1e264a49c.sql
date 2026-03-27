-- Add opening_balance column to customers table
ALTER TABLE public.customers 
ADD COLUMN opening_balance numeric DEFAULT 0;

-- Add opening_balance column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN opening_balance numeric DEFAULT 0;