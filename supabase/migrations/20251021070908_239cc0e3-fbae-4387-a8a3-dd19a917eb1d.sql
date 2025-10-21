-- Step 1: Delete the orphaned ledger entry
DELETE FROM customer_ledger 
WHERE id = '1a9a16a4-76af-4ad7-bc2a-ef67a9de072e';

-- Step 2: Clean up any other orphaned sale entries in customer_ledger
DELETE FROM customer_ledger 
WHERE transaction_type = 'sale' 
  AND reference_id NOT IN (SELECT id FROM sales);

-- Step 3: Clean up any other orphaned receipt entries in customer_ledger
DELETE FROM customer_ledger 
WHERE transaction_type = 'receipt' 
  AND reference_id NOT IN (SELECT id FROM receipts);

-- Step 4: Clean up any other orphaned credit note entries in customer_ledger
DELETE FROM customer_ledger 
WHERE transaction_type = 'credit_note' 
  AND reference_id NOT IN (SELECT id FROM credit_notes);

-- Step 5: Clean up any other orphaned debit note entries in customer_ledger
DELETE FROM customer_ledger 
WHERE transaction_type = 'debit_note' 
  AND reference_id NOT IN (SELECT id FROM debit_notes);

-- Step 6: Add foreign key constraints to prevent future orphaned entries
-- Note: We can't add a single FK because reference_id points to different tables
-- Instead, we'll add a constraint to ensure reference_id exists in the appropriate table
-- This is handled by triggers or application logic

-- Add indexes to improve lookup performance
CREATE INDEX IF NOT EXISTS idx_customer_ledger_reference_id ON customer_ledger(reference_id);
CREATE INDEX IF NOT EXISTS idx_customer_ledger_transaction_type ON customer_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer_date ON customer_ledger(customer_id, transaction_date);