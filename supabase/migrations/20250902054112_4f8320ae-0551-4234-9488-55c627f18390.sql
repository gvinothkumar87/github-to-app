-- Create user_roles table (enum already exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role user_role NOT NULL,
  assigned_location_id UUID REFERENCES public.locations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for proper access control

-- Customers: Only admin and manager roles
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Admin and managers can manage customers" 
ON public.customers 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Suppliers: Only admin and manager roles  
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
CREATE POLICY "Admin and managers can manage suppliers"
ON public.suppliers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Locations: Only admin role
DROP POLICY IF EXISTS "All authenticated users can manage locations" ON public.locations;
DROP POLICY IF EXISTS "All authenticated users can view locations" ON public.locations;
CREATE POLICY "Only admins can manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Outward entries: Operators can create, managers can modify
DROP POLICY IF EXISTS "Authenticated users can manage outward entries" ON public.outward_entries;
CREATE POLICY "Operators can insert outward entries"
ON public.outward_entries
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can update outward entries"
ON public.outward_entries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view outward entries"
ON public.outward_entries
FOR SELECT
TO authenticated
USING (true);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();