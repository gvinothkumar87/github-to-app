-- Add E-Invoice & E-Way Bill Credentials to company_settings
ALTER TABLE public.company_settings
ADD COLUMN einvoice_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN einvoice_aspid TEXT,
ADD COLUMN einvoice_asppassword TEXT,
ADD COLUMN einvoice_username TEXT,
ADD COLUMN einvoice_password TEXT,
ADD COLUMN einvoice_sandbox BOOLEAN DEFAULT TRUE;

-- Add E-Invoice & E-Way Bill Status fields to sales
ALTER TABLE public.sales
ADD COLUMN eway_bill_no TEXT,
ADD COLUMN eway_bill_date TEXT,
ADD COLUMN eway_bill_status TEXT,
ADD COLUMN einvoice_status TEXT,
ADD COLUMN ack_no TEXT,
ADD COLUMN ack_date TEXT,
ADD COLUMN signed_invoice TEXT,
ADD COLUMN signed_qrcode TEXT;
