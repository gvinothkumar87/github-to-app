ALTER TABLE public.debit_notes
  ADD COLUMN IF NOT EXISTS irn text,
  ADD COLUMN IF NOT EXISTS einvoice_status text DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS ack_no text,
  ADD COLUMN IF NOT EXISTS ack_date text,
  ADD COLUMN IF NOT EXISTS signed_qrcode text,
  ADD COLUMN IF NOT EXISTS signed_invoice text;
ALTER TABLE public.credit_notes
  ADD COLUMN IF NOT EXISTS irn text,
  ADD COLUMN IF NOT EXISTS einvoice_status text DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS ack_no text,
  ADD COLUMN IF NOT EXISTS ack_date text,
  ADD COLUMN IF NOT EXISTS signed_qrcode text,
  ADD COLUMN IF NOT EXISTS signed_invoice text;
