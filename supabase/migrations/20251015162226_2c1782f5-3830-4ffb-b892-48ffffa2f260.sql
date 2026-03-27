-- Add lorry_no column to sales table to store lorry number for direct sales
ALTER TABLE sales ADD COLUMN lorry_no text;

-- Add comment for documentation
COMMENT ON COLUMN sales.lorry_no IS 'Lorry number for direct sales (since they don''t have outward_entry records). For regular sales, this is stored in outward_entries table.';