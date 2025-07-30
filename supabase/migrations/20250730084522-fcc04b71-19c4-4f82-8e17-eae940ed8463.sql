-- Diagnostic function to test auth.uid() propagation
CREATE OR REPLACE FUNCTION public.diagnose_auth_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_jwt_exists', auth.jwt() IS NOT NULL,
    'auth_role', current_setting('request.jwt.claims', true)::jsonb->>'role',
    'session_user', session_user,
    'current_user', current_user,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Temporary secure function for dossier creation that bypasses RLS issues
CREATE OR REPLACE FUNCTION public.create_dossier_secure(
  p_client_id uuid,
  p_type_sinistre type_sinistre,
  p_date_sinistre date,
  p_montant_refuse numeric,
  p_refus_date date,
  p_police_number text,
  p_compagnie_assurance text,
  p_motif_refus text DEFAULT NULL,
  p_adresse_assureur jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_dossier_id uuid;
  current_auth_uid uuid;
BEGIN
  -- Verify authentication
  current_auth_uid := auth.uid();
  
  IF current_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify the client_id matches the authenticated user
  IF current_auth_uid != p_client_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot create dossier for another user';
  END IF;
  
  -- Insert the dossier directly (bypassing RLS)
  INSERT INTO public.dossiers (
    client_id,
    type_sinistre,
    date_sinistre,
    montant_refuse,
    refus_date,
    police_number,
    compagnie_assurance,
    motif_refus,
    adresse_assureur,
    statut
  ) VALUES (
    p_client_id,
    p_type_sinistre,
    p_date_sinistre,
    p_montant_refuse,
    p_refus_date,
    p_police_number,
    p_compagnie_assurance,
    p_motif_refus,
    p_adresse_assureur,
    'nouveau'::statut_dossier
  )
  RETURNING id INTO new_dossier_id;
  
  RETURN new_dossier_id;
END;
$$;