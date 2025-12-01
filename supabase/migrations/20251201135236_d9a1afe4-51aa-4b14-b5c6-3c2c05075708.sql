-- Create audit_logs table for tracking data access
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Auditors and admins can view all logs
CREATE POLICY "Auditors and admins can view all logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'auditor') OR
  public.has_role(auth.uid(), 'admin')
);

-- Policy: System can insert logs (via service role)
CREATE POLICY "System can insert logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Add location field to transactions table for geographic anomaly detection
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS location text;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_transactions_location ON public.transactions(location);