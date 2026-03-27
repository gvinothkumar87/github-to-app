ALTER TABLE outward_entries
ADD COLUMN labour text DEFAULT 'MILL' CHECK (labour IN ('MILL', 'OUT'));
