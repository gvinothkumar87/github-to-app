-- Drop tables if they exist to reset (for this migration script since it failed halfway maybe?)
DROP TABLE IF EXISTS user_page_access;
DROP TABLE IF EXISTS app_pages;

-- Create app_pages table
CREATE TABLE IF NOT EXISTS app_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    route TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_page_access table
-- Note: modifying user_id to be UUID. If app_users.id is text, we might need to cast or remove FK. 
-- Assuming app_users.id is UUID compatible.
CREATE TABLE IF NOT EXISTS user_page_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Removing FK constraint temporarily if type mismatch is the issue, or keeping it if we are sure.
    page_id UUID NOT NULL REFERENCES app_pages(id) ON DELETE CASCADE,
    can_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, page_id)
);
-- Add FK if possible, but let's try to be safe. 
-- Actually, let's keep it simple. user_id should be uuid.

-- Enable RLS
ALTER TABLE app_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_page_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_pages
CREATE POLICY "Admins can manage app_pages" ON app_pages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id::text = auth.uid()::text -- Cast both to text
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can read app_pages" ON app_pages
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for user_page_access
CREATE POLICY "Admins can manage user_page_access" ON user_page_access
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id::text = auth.uid()::text -- Cast both to text
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can read own access" ON user_page_access
    FOR SELECT
    TO authenticated
    USING (user_id::text = auth.uid()::text); -- Cast both to text

-- Seed Pages
INSERT INTO app_pages (name, route, description) VALUES
('Outward Entries', 'index:entries', 'Dashboard: View and manage outward entries'),
('Load Weight', 'index:load-weight', 'Dashboard: Record load weights'),
('Direct Sales', 'index:direct-sales', 'Dashboard: Create direct sales'),
('Sales from Transit', 'index:outward-sales', 'Dashboard: Create sales from transit entries'),
('Sales Ledger', 'index:sales-ledger', 'Dashboard: View sales ledger'),
('Amount Received', 'index:amount-received', 'Dashboard: Record payments received'),
('Customer Ledger', 'index:customer-ledger', 'Dashboard: View customer ledger'),
('Delete Entry', 'index:admin-delete', 'Dashboard: Delete entries (Admin)'),
('Customers', 'index:customers', 'Dashboard: Manage customers'),
('Items', 'index:items', 'Dashboard: Manage items'),
('Reports', 'index:reports', 'Dashboard: View reports'),
('Bills Management', '/bills', 'Manage sales bills'),
('Debit Note', '/debit-note', 'Manage debit notes'),
('Credit Note', '/credit-note', 'Manage credit notes'),
('Suppliers', '/suppliers', 'Manage suppliers'),
('Purchases', '/purchases', 'Manage purchases'),
('Supplier Ledger', '/supplier-ledger', 'View supplier ledger'),
('Stock Ledger', '/stock-ledger', 'View stock ledger'),
('GST Export', '/gst-export', 'Export GST data'),
('Company Settings', '/company-settings', 'Manage company settings'),
('Page Access Control', '/page-access', 'Manage user page permissions')
ON CONFLICT (route) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Function to check page access
CREATE OR REPLACE FUNCTION user_has_page_access(_user_id UUID, _page_route TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    _is_admin BOOLEAN;
    _can_access BOOLEAN;
BEGIN
    -- Check if admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id::text = _user_id::text -- Cast
        AND role = 'admin'
    ) INTO _is_admin;

    IF _is_admin THEN
        RETURN TRUE;
    END IF;

    -- Check specific access
    SELECT can_access INTO _can_access
    FROM user_page_access upa
    JOIN app_pages ap ON upa.page_id = ap.id
    WHERE upa.user_id = _user_id
    AND ap.route = _page_route;

    RETURN COALESCE(_can_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all accessible pages for a user
CREATE OR REPLACE FUNCTION get_user_accessible_pages(_user_id UUID)
RETURNS TABLE (
    page_id UUID,
    page_name TEXT,
    page_route TEXT,
    description TEXT
) AS $$
DECLARE
    _is_admin BOOLEAN;
BEGIN
    -- Check if admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id::text = _user_id::text -- Cast
        AND role = 'admin'
    ) INTO _is_admin;

    IF _is_admin THEN
        RETURN QUERY SELECT id, name, route, app_pages.description FROM app_pages;
    ELSE
        RETURN QUERY 
        SELECT ap.id, ap.name, ap.route, ap.description 
        FROM app_pages ap
        JOIN user_page_access upa ON ap.id = upa.page_id
        WHERE upa.user_id = _user_id AND upa.can_access = TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
