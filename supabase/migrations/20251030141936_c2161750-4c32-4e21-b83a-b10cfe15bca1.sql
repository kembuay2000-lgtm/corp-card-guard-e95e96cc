-- Add categoria column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS categoria text;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_cpf_portador ON public.transactions(cpf_portador);
CREATE INDEX IF NOT EXISTS idx_transactions_data_transacao ON public.transactions(data_transacao);
CREATE INDEX IF NOT EXISTS idx_transactions_valor_transacao ON public.transactions(valor_transacao);
CREATE INDEX IF NOT EXISTS idx_transactions_mes_ano ON public.transactions(mes_extrato, ano_extrato);
CREATE INDEX IF NOT EXISTS idx_transactions_categoria ON public.transactions(categoria);