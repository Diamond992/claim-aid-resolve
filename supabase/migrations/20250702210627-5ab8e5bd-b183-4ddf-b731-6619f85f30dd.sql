
-- Create enum type for document types
CREATE TYPE public.type_document AS ENUM ('refus_assurance', 'police', 'facture', 'expertise', 'autre');

-- Create the documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  nom_fichier VARCHAR(255) NOT NULL,
  type_document type_document NOT NULL,
  url_stockage VARCHAR(500) NOT NULL,
  taille_fichier BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view documents from their own dossiers
CREATE POLICY "Users can view documents from their own dossiers" 
  ON public.documents 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.dossiers 
      WHERE dossiers.id = documents.dossier_id 
      AND dossiers.client_id = auth.uid()
    )
  );

-- Users can upload documents to their own dossiers
CREATE POLICY "Users can upload documents to their own dossiers" 
  ON public.documents 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.dossiers 
      WHERE dossiers.id = documents.dossier_id 
      AND dossiers.client_id = auth.uid()
    )
  );

-- Users can update documents they uploaded to their own dossiers
CREATE POLICY "Users can update their own documents" 
  ON public.documents 
  FOR UPDATE 
  USING (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.dossiers 
      WHERE dossiers.id = documents.dossier_id 
      AND dossiers.client_id = auth.uid()
    )
  );

-- Users can delete documents they uploaded to their own dossiers
CREATE POLICY "Users can delete their own documents" 
  ON public.documents 
  FOR DELETE 
  USING (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.dossiers 
      WHERE dossiers.id = documents.dossier_id 
      AND dossiers.client_id = auth.uid()
    )
  );

-- Admins can view all documents
CREATE POLICY "Admins can view all documents" 
  ON public.documents 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update all documents
CREATE POLICY "Admins can update all documents" 
  ON public.documents 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete all documents
CREATE POLICY "Admins can delete all documents" 
  ON public.documents 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- Create function to notify Make.com webhook
CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID'; -- Replace with actual webhook URL
  payload JSON;
BEGIN
  -- Prepare the payload
  payload := json_build_object(
    'event', 'document_uploaded',
    'document_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'nom_fichier', NEW.nom_fichier,
    'type_document', NEW.type_document,
    'taille_fichier', NEW.taille_fichier,
    'mime_type', NEW.mime_type,
    'uploaded_by', NEW.uploaded_by,
    'created_at', NEW.created_at
  );

  -- Make HTTP request to Make.com webhook (this requires pg_net extension)
  -- Note: This is a placeholder - you'll need to configure the actual webhook URL
  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload::jsonb
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to notify Make.com webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify Make.com on document upload
CREATE TRIGGER notify_document_upload_trigger
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_upload();

-- Enable pg_net extension for HTTP requests (if not already enabled)
-- Note: This may require superuser privileges
CREATE EXTENSION IF NOT EXISTS pg_net;
