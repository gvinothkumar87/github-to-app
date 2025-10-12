-- Add load_weight_photo_url column to outward_entries table
ALTER TABLE public.outward_entries 
ADD COLUMN IF NOT EXISTS load_weight_photo_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.outward_entries.load_weight_photo_url IS 'Google Drive URL for the load weight photo';