-- Update PULIVANTHI address to include village name
UPDATE public.company_settings 
SET 
  address_line1 = '6/175 GINGEE MAIN ROAD, PULIVANTHI VILLAGE',
  updated_at = now()
WHERE location_code = 'PULIVANTHI';