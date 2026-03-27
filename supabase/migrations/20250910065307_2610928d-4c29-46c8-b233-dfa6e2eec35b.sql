-- Add debit note and credit note tables
CREATE TABLE public.debit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_no TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  reference_bill_no TEXT,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_no TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  reference_bill_no TEXT,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to debit_notes" 
ON public.debit_notes 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all access to credit_notes" 
ON public.credit_notes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create functions to generate note numbers
CREATE OR REPLACE FUNCTION public.generate_debit_note_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  next_number INTEGER;
  new_note_no TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(note_no FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.debit_notes
  WHERE note_no ~ '^DN[0-9]+$';
  
  new_note_no := 'DN' || LPAD(next_number::TEXT, 6, '0');
  RETURN new_note_no;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_credit_note_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  next_number INTEGER;
  new_note_no TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(note_no FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.credit_notes
  WHERE note_no ~ '^CN[0-9]+$';
  
  new_note_no := 'CN' || LPAD(next_number::TEXT, 6, '0');
  RETURN new_note_no;
END;
$function$;

-- Create triggers for updated_at
CREATE TRIGGER update_debit_notes_updated_at
BEFORE UPDATE ON public.debit_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_notes_updated_at
BEFORE UPDATE ON public.credit_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create triggers to update customer ledger
CREATE OR REPLACE FUNCTION public.handle_debit_note_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert into customer ledger as debit (increases customer debt)
    INSERT INTO public.customer_ledger (
      customer_id,
      transaction_type,
      reference_id,
      debit_amount,
      credit_amount,
      transaction_date,
      description
    ) VALUES (
      NEW.customer_id,
      'debit_note',
      NEW.id,
      NEW.amount,
      0,
      NEW.note_date,
      'Debit Note ' || NEW.note_no || ' - ' || NEW.reason
    );
    
    -- Update customer balance
    UPDATE public.customer_ledger 
    SET balance = (
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
      FROM public.customer_ledger 
      WHERE customer_id = NEW.customer_id
    )
    WHERE customer_id = NEW.customer_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from customer ledger
    DELETE FROM public.customer_ledger 
    WHERE transaction_type = 'debit_note' AND reference_id = OLD.id;
    
    -- Update customer balance
    UPDATE public.customer_ledger 
    SET balance = (
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
      FROM public.customer_ledger 
      WHERE customer_id = OLD.customer_id
    )
    WHERE customer_id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_credit_note_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert into customer ledger as credit (decreases customer debt)
    INSERT INTO public.customer_ledger (
      customer_id,
      transaction_type,
      reference_id,
      debit_amount,
      credit_amount,
      transaction_date,
      description
    ) VALUES (
      NEW.customer_id,
      'credit_note',
      NEW.id,
      0,
      NEW.amount,
      NEW.note_date,
      'Credit Note ' || NEW.note_no || ' - ' || NEW.reason
    );
    
    -- Update customer balance
    UPDATE public.customer_ledger 
    SET balance = (
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
      FROM public.customer_ledger 
      WHERE customer_id = NEW.customer_id
    )
    WHERE customer_id = NEW.customer_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from customer ledger
    DELETE FROM public.customer_ledger 
    WHERE transaction_type = 'credit_note' AND reference_id = OLD.id;
    
    -- Update customer balance
    UPDATE public.customer_ledger 
    SET balance = (
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
      FROM public.customer_ledger 
      WHERE customer_id = OLD.customer_id
    )
    WHERE customer_id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER debit_note_ledger_trigger
AFTER INSERT OR DELETE ON public.debit_notes
FOR EACH ROW EXECUTE FUNCTION public.handle_debit_note_ledger();

CREATE TRIGGER credit_note_ledger_trigger
AFTER INSERT OR DELETE ON public.credit_notes
FOR EACH ROW EXECUTE FUNCTION public.handle_credit_note_ledger();