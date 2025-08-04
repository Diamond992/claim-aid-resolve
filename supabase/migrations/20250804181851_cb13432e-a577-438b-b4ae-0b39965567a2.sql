-- Fix remaining database function security warnings by adding proper search_path

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN data IS NULL OR data = '' THEN data
    ELSE encode(encrypt(data::bytea, 'encryption_key', 'aes'), 'base64')
  END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN encrypted_data IS NULL OR encrypted_data = '' THEN encrypted_data
    ELSE convert_from(decrypt(decode(encrypted_data, 'base64'), 'encryption_key', 'aes'), 'UTF8')
  END;
$function$;

CREATE OR REPLACE FUNCTION public.log_admin_action(action_type text, target_user uuid DEFAULT NULL::uuid, action_details jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user, action_details);
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_auth_before_insert()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND auth.jwt() IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_dossier_safe(dossier_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN user_id IS NULL THEN false
    ELSE (
      public.get_user_role(user_id) = 'admin'::app_role
      OR 
      public.is_owner(dossier_id, user_id)
    )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_roles.user_id = get_user_role.user_id
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_owner(dossier_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.dossiers
    WHERE dossiers.id = is_owner.dossier_id
      AND dossiers.client_id = is_owner.user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_dossier(dossier_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    public.get_user_role(can_access_dossier.user_id) = 'admin'::app_role
    OR 
    public.is_owner(can_access_dossier.dossier_id, can_access_dossier.user_id);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.get_user_role(COALESCE(is_admin.user_id, auth.uid())) = 'admin'::app_role;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;