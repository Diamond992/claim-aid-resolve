-- Créer une fonction sécurisée pour l'upload de documents
CREATE OR REPLACE FUNCTION public.upload_document_secure(
  p_dossier_id uuid,
  p_nom_fichier text,
  p_type_document type_document,
  p_taille_fichier bigint,
  p_mime_type text,
  p_url_stockage text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_document_id uuid;
  current_user_id uuid;
BEGIN
  -- Vérifier l'authentification
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Vérifier l'accès au dossier (une seule requête simple)
  IF NOT EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE id = p_dossier_id 
    AND client_id = current_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = current_user_id 
    AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Access denied to dossier';
  END IF;
  
  -- Insérer le document directement (bypass RLS avec SECURITY DEFINER)
  INSERT INTO public.documents (
    dossier_id,
    nom_fichier,
    type_document,
    taille_fichier,
    mime_type,
    url_stockage,
    uploaded_by
  ) VALUES (
    p_dossier_id,
    p_nom_fichier,
    p_type_document,
    p_taille_fichier,
    p_mime_type,
    p_url_stockage,
    current_user_id
  )
  RETURNING id INTO new_document_id;
  
  RETURN new_document_id;
END;
$$;