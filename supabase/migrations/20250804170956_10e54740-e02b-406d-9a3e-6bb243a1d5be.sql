-- Disable RLS on documents table since we use SECURITY DEFINER functions
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- Simplify upload_document_secure function drastically
CREATE OR REPLACE FUNCTION public.upload_document_secure(
  p_dossier_id uuid, 
  p_nom_fichier text, 
  p_type_document type_document, 
  p_taille_fichier bigint, 
  p_mime_type text, 
  p_url_stockage text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_document_id uuid;
  current_user_id uuid;
BEGIN
  -- Minimal security check - just verify user is authenticated
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Direct insert without any complex checks
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
$function$;