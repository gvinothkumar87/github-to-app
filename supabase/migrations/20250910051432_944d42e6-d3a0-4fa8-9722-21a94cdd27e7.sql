-- Add HSN No and GST percentage fields to items table
ALTER TABLE public.items 
ADD COLUMN hsn_no TEXT,
ADD COLUMN gst_percentage NUMERIC(5,2) DEFAULT 0.00;