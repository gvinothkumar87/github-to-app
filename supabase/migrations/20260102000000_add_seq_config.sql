ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS start_bill_no bigint DEFAULT 1,
ADD COLUMN IF NOT EXISTS start_debit_note_no bigint DEFAULT 1,
ADD COLUMN IF NOT EXISTS start_credit_note_no bigint DEFAULT 1;
