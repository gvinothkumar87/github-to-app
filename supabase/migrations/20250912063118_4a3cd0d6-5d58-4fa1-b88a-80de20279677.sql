-- Add new fields to customers table for JSON compatibility
ALTER TABLE public.customers 
ADD COLUMN pin_code text,
ADD COLUMN state_code text DEFAULT '33',
ADD COLUMN place_of_supply text DEFAULT '33';

-- Create company_settings table for configurable company details
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_code text NOT NULL UNIQUE,
  location_name text NOT NULL,
  company_name text NOT NULL,
  gstin text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  locality text NOT NULL,
  pin_code integer NOT NULL,
  state_code text NOT NULL DEFAULT '33',
  phone text,
  email text,
  bank_name text,
  bank_account_no text,
  bank_ifsc text,
  bank_branch text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for company_settings
CREATE POLICY "Authenticated users can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage company settings" 
ON public.company_settings 
FOR ALL 
USING (has_role((auth.uid())::text, 'admin'::app_role))
WITH CHECK (has_role((auth.uid())::text, 'admin'::app_role));

-- Insert default company settings for existing locations
INSERT INTO public.company_settings (
  location_code, location_name, company_name, gstin, 
  address_line1, address_line2, locality, pin_code, state_code,
  phone, email
) VALUES 
(
  'PULIVANTHI', 'Pulivanthi Location', 'GOVINDAN RICE MILL', '33AALFG0221E1Z3',
  '6/175 GINGEE MAIN ROAD', 'GINGEE TALUK, VILLUPURAM DISTRICT', 'GINGEE', 605601, '33',
  '9790404001', 'ER.CGVIGNESH@GMAIL.COM'
),
(
  'MATTAPARAI', 'Mattaparai Location', 'GOVINDAN RICE MILL', '33AALFG0221E1Z3', 
  'S.No.58, SE KUNNATHURE ROAD,MATTAPARAI', 'GINGEE TK., VILLUPURAM DIST.', 'MATTAPARAI VILLAGE', 605201, '33',
  '9790404001', 'ER.CGVIGNESH@GMAIL.COM'
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();