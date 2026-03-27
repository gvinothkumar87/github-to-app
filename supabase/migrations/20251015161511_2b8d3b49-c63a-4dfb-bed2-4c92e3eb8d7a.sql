-- Add loading_place column to sales table to store the location for direct sales
ALTER TABLE sales ADD COLUMN loading_place text DEFAULT 'PULIVANTHI';

-- Add comment for documentation
COMMENT ON COLUMN sales.loading_place IS 'Loading place for the sale (PULIVANTHI or MATTAPARAI). Essential for direct sales to determine correct company address on invoice.';