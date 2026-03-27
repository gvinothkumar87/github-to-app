-- Create error logging table for failed transactions
CREATE TABLE IF NOT EXISTS public.failed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'receipt', 'credit_note', 'debit_note')),
  attempted_data JSONB NOT NULL,
  error_message TEXT NOT NULL,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'failed' CHECK (status IN ('failed', 'retrying', 'permanently_failed', 'resolved')),
  last_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.failed_transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_failed_transactions_user_id ON public.failed_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_status ON public.failed_transactions(status);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_created_at ON public.failed_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_type ON public.failed_transactions(transaction_type);

-- RLS Policies
CREATE POLICY "Users can view their own failed transactions"
  ON public.failed_transactions
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all failed transactions"
  ON public.failed_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "System can insert failed transactions"
  ON public.failed_transactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own failed transactions"
  ON public.failed_transactions
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_failed_transactions_updated_at
  BEFORE UPDATE ON public.failed_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log failed transaction
CREATE OR REPLACE FUNCTION public.log_failed_transaction(
  p_user_id TEXT,
  p_transaction_type TEXT,
  p_attempted_data JSONB,
  p_error_message TEXT,
  p_error_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_failed_transaction_id UUID;
BEGIN
  INSERT INTO public.failed_transactions (
    user_id,
    transaction_type,
    attempted_data,
    error_message,
    error_code,
    status,
    retry_count
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_attempted_data,
    p_error_message,
    p_error_code,
    'failed',
    0
  )
  RETURNING id INTO v_failed_transaction_id;
  
  RETURN v_failed_transaction_id;
END;
$$;

-- Function to update retry attempt
CREATE OR REPLACE FUNCTION public.update_retry_attempt(
  p_transaction_id UUID,
  p_success BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_success THEN
    UPDATE public.failed_transactions
    SET 
      status = 'resolved',
      updated_at = now()
    WHERE id = p_transaction_id;
  ELSE
    UPDATE public.failed_transactions
    SET 
      retry_count = retry_count + 1,
      last_retry_at = now(),
      status = CASE 
        WHEN retry_count + 1 >= 3 THEN 'permanently_failed'
        ELSE 'retrying'
      END,
      updated_at = now()
    WHERE id = p_transaction_id;
  END IF;
END;
$$;

-- Function to get failed transactions summary
CREATE OR REPLACE FUNCTION public.get_failed_transactions_summary(p_user_id TEXT DEFAULT NULL)
RETURNS TABLE (
  transaction_type TEXT,
  total_count BIGINT,
  retrying_count BIGINT,
  permanently_failed_count BIGINT,
  resolved_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ft.transaction_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE ft.status = 'retrying') as retrying_count,
    COUNT(*) FILTER (WHERE ft.status = 'permanently_failed') as permanently_failed_count,
    COUNT(*) FILTER (WHERE ft.status = 'resolved') as resolved_count
  FROM public.failed_transactions ft
  WHERE p_user_id IS NULL OR ft.user_id = p_user_id
  GROUP BY ft.transaction_type;
$$;