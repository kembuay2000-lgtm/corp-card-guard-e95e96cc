-- Create storage bucket for alert justification attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alert-attachments',
  'alert-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Policy: Users can upload their own attachments
CREATE POLICY "Users can upload alert attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'alert-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view attachments they uploaded
CREATE POLICY "Users can view their own attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'alert-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Auditors and admins can view all attachments
CREATE POLICY "Auditors and admins can view all attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'alert-attachments' AND
  (
    public.has_role(auth.uid(), 'auditor') OR
    public.has_role(auth.uid(), 'admin')
  )
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'alert-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);