ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS bill_prefix text,
ADD COLUMN IF NOT EXISTS bill_digits int DEFAULT 3,
ADD COLUMN IF NOT EXISTS debit_note_prefix text,
ADD COLUMN IF NOT EXISTS debit_note_digits int DEFAULT 3,
ADD COLUMN IF NOT EXISTS credit_note_prefix text,
ADD COLUMN IF NOT EXISTS credit_note_digits int DEFAULT 3;
