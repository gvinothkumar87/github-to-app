-- Drop the ambiguous function with TEXT argument if it exists
DROP FUNCTION IF EXISTS get_user_accessible_pages(text);

-- Ensure the UUID version is correct (re-apply just in case, though not strictly necessary if previous migration worked)
-- But the previous migration didn't strictly drop the text version if it was created differently.
