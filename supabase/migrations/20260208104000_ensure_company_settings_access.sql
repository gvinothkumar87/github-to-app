-- Enable RLS on company_settings table
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read company settings
-- Using DO block to avoid error if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'company_settings'
        AND policyname = 'Allow read access to authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to authenticated users"
        ON company_settings
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END
$$;
