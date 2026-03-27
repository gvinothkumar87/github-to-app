-- Add mill column to credit_notes and debit_notes tables
ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS mill text NOT NULL DEFAULT 'PULIVANTHI';
ALTER TABLE debit_notes ADD COLUMN IF NOT EXISTS mill text NOT NULL DEFAULT 'PULIVANTHI';

-- Create function to generate credit note number based on mill
CREATE OR REPLACE FUNCTION generate_credit_note_no(p_mill text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_no integer;
  v_prefix text;
  v_note_no text;
BEGIN
  -- Set prefix based on mill
  IF p_mill = 'MATTAPARAI' THEN
    v_prefix := 'GRMCN';
  ELSE
    v_prefix := 'CN';
  END IF;
  
  -- Get the next number for this mill
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN note_no LIKE v_prefix || '%' THEN
          CAST(SUBSTRING(note_no FROM LENGTH(v_prefix) + 1) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) + 1
  INTO v_next_no
  FROM credit_notes
  WHERE mill = p_mill;
  
  -- Format the note number with leading zeros (6 digits)
  v_note_no := v_prefix || LPAD(v_next_no::text, 6, '0');
  
  RETURN v_note_no;
END;
$$;

-- Create function to generate debit note number based on mill
CREATE OR REPLACE FUNCTION generate_debit_note_no(p_mill text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_no integer;
  v_prefix text;
  v_note_no text;
BEGIN
  -- Set prefix based on mill
  IF p_mill = 'MATTAPARAI' THEN
    v_prefix := 'GRMDN';
  ELSE
    v_prefix := 'DN';
  END IF;
  
  -- Get the next number for this mill
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN note_no LIKE v_prefix || '%' THEN
          CAST(SUBSTRING(note_no FROM LENGTH(v_prefix) + 1) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) + 1
  INTO v_next_no
  FROM debit_notes
  WHERE mill = p_mill;
  
  -- Format the note number with leading zeros (6 digits)
  v_note_no := v_prefix || LPAD(v_next_no::text, 6, '0');
  
  RETURN v_note_no;
END;
$$;