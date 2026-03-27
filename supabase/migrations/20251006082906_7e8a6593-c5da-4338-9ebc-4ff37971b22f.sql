-- Add weighment photo URL column to outward_entries table
ALTER TABLE public.outward_entries 
ADD COLUMN IF NOT EXISTS weighment_photo_url text;