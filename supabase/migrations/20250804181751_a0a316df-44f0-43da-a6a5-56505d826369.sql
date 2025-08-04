-- CRITICAL SECURITY FIXES

-- 1. Re-enable RLS on documents table and create secure policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view documents from their accessible dossiers
CREATE POLICY "Users can view documents from accessible dossiers" 
ON public.documents 
FOR SELECT 
USING (can_access_dossier(dossier_id, auth.uid()));

-- Policy: Users can only insert documents to their accessible dossiers
CREATE POLICY "Users can insert documents to accessible dossiers" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  can_access_dossier(dossier_id, auth.uid()) 
  AND auth.uid() = uploaded_by
);

-- Policy: Users can only update documents they uploaded in accessible dossiers
CREATE POLICY "Users can update their documents in accessible dossiers" 
ON public.documents 
FOR UPDATE 
USING (
  can_access_dossier(dossier_id, auth.uid()) 
  AND auth.uid() = uploaded_by
);

-- Policy: Users can only delete documents they uploaded in accessible dossiers
CREATE POLICY "Users can delete their documents in accessible dossiers" 
ON public.documents 
FOR DELETE 
USING (
  can_access_dossier(dossier_id, auth.uid()) 
  AND auth.uid() = uploaded_by
);

-- 2. Fix database function security - add proper search_path to all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.diagnose_auth_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_dossier_secure(p_client_id uuid, p_type_sinistre type_sinistre, p_date_sinistre date, p_montant_refuse numeric, p_refus_date date, p_police_number text, p_compagnie_assurance text, p_motif_refus text DEFAULT NULL::text, p_adresse_assureur jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_admin_invite(admin_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_code text;
BEGIN
  -- Generate a secure random invite code
  invite_code := encode(gen_random_bytes(32), 'base64');
  invite_code := replace(invite_code, '/', '_');
  invite_code := replace(invite_code, '+', '-');
  
  -- Insert the invitation
  INSERT INTO public.admin_invitations (email, invite_code, created_by)
  VALUES (admin_email, invite_code, auth.uid());
  
  RETURN invite_code;
END;
$function$;

-- 3. Secure role management - prevent privilege escalation
CREATE OR REPLACE FUNCTION public.secure_change_user_role(target_user_id uuid, new_role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id uuid;
  current_user_role app_role;
  target_current_role app_role;
BEGIN
  admin_user_id := auth.uid();
  
  -- Verify admin is authenticated
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify the caller is an admin
  SELECT role INTO current_user_role FROM public.user_roles WHERE user_id = admin_user_id;
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  
  -- Prevent self-role modification (security measure)
  IF admin_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot modify your own role';
  END IF;
  
  -- Get current role of target user
  SELECT role INTO target_current_role FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Log the role change attempt
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    admin_user_id, 
    'role_change', 
    target_user_id, 
    jsonb_build_object(
      'old_role', target_current_role,
      'new_role', new_role,
      'timestamp', now()
    )
  );
  
  -- Update the role
  UPDATE public.user_roles 
  SET role = new_role 
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$function$;

-- 4. Add audit logging for document access
CREATE TABLE IF NOT EXISTS public.document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL,
  dossier_id uuid NOT NULL,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view document access logs" 
ON public.document_access_log 
FOR SELECT 
USING (is_admin(auth.uid()));

-- 5. Remove the insecure upload_document_secure function since RLS is now properly enabled
DROP FUNCTION IF EXISTS public.upload_document_secure(uuid, text, type_document, bigint, text, text);