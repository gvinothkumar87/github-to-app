-- Add E-Way Bill password and enable flag to company_settings
ALTER TABLE public.company_settings
ADD COLUMN ewaybill_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN ewaybill_password TEXT;
