-- Add gst_percentage column to credit_notes table
ALTER TABLE public.credit_notes 
ADD COLUMN gst_percentage numeric DEFAULT 18.00;

-- Add gst_percentage column to debit_notes table  
ALTER TABLE public.debit_notes 
ADD COLUMN gst_percentage numeric DEFAULT 18.00;