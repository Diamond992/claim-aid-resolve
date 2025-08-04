-- Fix storage bucket configuration (make it public for easier access)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Optimize storage policies for better performance
DROP POLICY IF EXISTS "Users can upload documents to their own folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create simpler, more efficient storage policies
CREATE POLICY "Users can upload documents to their own folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin(auth.uid())
  )
);

CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin(auth.uid())
  )
);

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_documents_dossier_id ON public.documents(dossier_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

-- Add index on dossiers for RLS performance
CREATE INDEX IF NOT EXISTS idx_dossiers_client_id ON public.dossiers(client_id);