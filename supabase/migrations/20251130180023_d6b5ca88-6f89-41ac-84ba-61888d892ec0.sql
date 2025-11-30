-- Criar tabela para justificativas de alertas
CREATE TABLE public.alert_justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  justification_text TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  reviewer_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para anexos de justificativas
CREATE TABLE public.alert_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  justification_id UUID NOT NULL REFERENCES public.alert_justifications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.alert_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para alert_justifications
CREATE POLICY "Users can view justifications for their own alerts"
ON public.alert_justifications
FOR SELECT
USING (
  submitted_by = auth.uid() OR
  has_role(auth.uid(), 'auditor'::app_role) OR
  has_role(auth.uid(), 'rh'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can submit justifications"
ON public.alert_justifications
FOR INSERT
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Auditors and managers can review justifications"
ON public.alert_justifications
FOR UPDATE
USING (
  has_role(auth.uid(), 'auditor'::app_role) OR
  has_role(auth.uid(), 'rh'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Políticas para alert_attachments
CREATE POLICY "Users can view attachments for their justifications"
ON public.alert_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.alert_justifications
    WHERE id = alert_attachments.justification_id
    AND (
      submitted_by = auth.uid() OR
      has_role(auth.uid(), 'auditor'::app_role) OR
      has_role(auth.uid(), 'rh'::app_role) OR
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "Users can upload attachments for their justifications"
ON public.alert_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.alert_justifications
    WHERE id = alert_attachments.justification_id
    AND submitted_by = auth.uid()
  )
);

-- Criar índices para performance
CREATE INDEX idx_alert_justifications_alert_id ON public.alert_justifications(alert_id);
CREATE INDEX idx_alert_justifications_submitted_by ON public.alert_justifications(submitted_by);
CREATE INDEX idx_alert_justifications_approval_status ON public.alert_justifications(approval_status);
CREATE INDEX idx_alert_attachments_justification_id ON public.alert_attachments(justification_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_alert_justifications_updated_at
BEFORE UPDATE ON public.alert_justifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();