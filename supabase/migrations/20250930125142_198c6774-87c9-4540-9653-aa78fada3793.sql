-- Add foreign key constraints for debit_notes and credit_notes tables to customers table
ALTER TABLE public.debit_notes 
ADD CONSTRAINT debit_notes_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE public.credit_notes 
ADD CONSTRAINT credit_notes_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);