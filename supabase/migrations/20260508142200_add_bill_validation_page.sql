INSERT INTO public.app_pages (name, route, description) 
VALUES ('Bill Sequence Errors', '/bill-validation-report', 'View retroactive validation errors for bill serial sequences')
ON CONFLICT (route) DO NOTHING;
