-- Create app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'operator');
    END IF;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read user_roles
DROP POLICY IF EXISTS "Allow read access to user_roles" ON public.user_roles;
CREATE POLICY "Allow read access to user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Now create delete policies for sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;

-- Allow admins to delete any sales rows
CREATE POLICY "Admins can delete sales" 
ON public.sales
FOR DELETE
TO authenticated
USING (public.has_role((auth.uid())::text, 'admin'));

-- Allow users to delete sales they created
CREATE POLICY "Users can delete their own sales" 
ON public.sales
FOR DELETE
TO authenticated
USING ((created_by IS NOT NULL) AND (created_by = (auth.uid())::text));