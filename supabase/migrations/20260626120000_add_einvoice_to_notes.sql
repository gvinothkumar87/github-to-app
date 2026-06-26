-- Add E-Invoice columns to credit_notes and debit_notes tables
ALTER TABLE public.credit_notes
  ADD COLUMN IF NOT EXISTS einvoice_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS ack_no TEXT,
  ADD COLUMN IF NOT EXISTS ack_date TEXT;

ALTER TABLE public.debit_notes
  ADD COLUMN IF NOT EXISTS einvoice_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS ack_no TEXT,
  ADD COLUMN IF NOT EXISTS ack_date TEXT;
