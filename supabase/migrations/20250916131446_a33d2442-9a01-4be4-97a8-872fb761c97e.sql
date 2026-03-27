-- Update the check constraint to allow debit_note and credit_note transaction types
ALTER TABLE public.customer_ledger 
DROP CONSTRAINT customer_ledger_transaction_type_check;

ALTER TABLE public.customer_ledger 
ADD CONSTRAINT customer_ledger_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY['sale'::text, 'receipt'::text, 'debit_note'::text, 'credit_note'::text]));