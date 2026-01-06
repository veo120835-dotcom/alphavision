-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Storage policies for attachments
CREATE POLICY "Users can upload attachments for their orgs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
);