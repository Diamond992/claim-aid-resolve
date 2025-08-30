-- Fix secure_delete_user function to properly handle auth.users deletion
-- and add cleanup function for orphaned users

CREATE OR REPLACE FUNCTION public.secure_delete_user(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id uuid;
  current_user_role app_role;
  dossier_ids uuid[];
  auth_deletion_success boolean := false;
BEGIN
  -- Get the current admin user
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
  
  -- Prevent self-deletion (security measure)
  IF admin_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own user account';
  END IF;
  
  -- Verify target user exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found in profiles table';
  END IF;
  
  -- Log the deletion attempt
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    admin_user_id, 
    'user_delete_started', 
    target_user_id, 
    jsonb_build_object(
      'timestamp', now(),
      'step', 'deletion_started'
    )
  );
  
  -- Get all dossier IDs for this user
  SELECT array_agg(id) INTO dossier_ids 
  FROM public.dossiers 
  WHERE client_id = target_user_id;
  
  -- Step 1: Delete all related data from public schema tables
  
  -- Delete documents
  DELETE FROM public.documents WHERE uploaded_by = target_user_id;
  
  -- Delete courriers and echeances if there are dossiers
  IF dossier_ids IS NOT NULL AND array_length(dossier_ids, 1) > 0 THEN
    DELETE FROM public.courriers_projets WHERE dossier_id = ANY(dossier_ids);
    DELETE FROM public.echeances WHERE dossier_id = ANY(dossier_ids);
  END IF;
  
  -- Delete payments
  DELETE FROM public.paiements WHERE client_id = target_user_id;
  
  -- Delete dossiers
  DELETE FROM public.dossiers WHERE client_id = target_user_id;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Step 2: Delete from auth.users using admin service role
  -- This needs to be done through the admin API, not direct SQL
  -- For now, we'll log this and let the cleanup function handle it
  
  -- Log that auth deletion needs to be done
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    admin_user_id, 
    'user_public_data_deleted', 
    target_user_id, 
    jsonb_build_object(
      'timestamp', now(),
      'step', 'public_data_deleted',
      'dossiers_deleted', COALESCE(array_length(dossier_ids, 1), 0),
      'auth_deletion_required', true
    )
  );
  
  RETURN true;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
    VALUES (
      admin_user_id, 
      'user_delete_failed', 
      target_user_id, 
      jsonb_build_object(
        'timestamp', now(),
        'error', SQLERRM,
        'step', 'deletion_failed'
      )
    );
    
    -- Re-raise the exception
    RAISE;
END;
$function$;

-- Create a function to identify orphaned users in auth.users
CREATE OR REPLACE FUNCTION public.get_orphaned_auth_users()
 RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- This function helps identify users that exist in auth.users but not in profiles
  -- These users should be cleaned up manually from the Supabase dashboard
  SELECT 
    au.id as user_id,
    au.email,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  AND au.email IS NOT NULL;
$function$;

-- Create a function to check if a user can be safely re-registered
CREATE OR REPLACE FUNCTION public.can_email_be_reused(check_email text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'email', check_email,
    'exists_in_auth', EXISTS(SELECT 1 FROM auth.users WHERE email = check_email),
    'exists_in_profiles', EXISTS(SELECT 1 FROM public.profiles WHERE email = check_email),
    'can_reuse', NOT EXISTS(SELECT 1 FROM auth.users WHERE email = check_email),
    'requires_cleanup', EXISTS(SELECT 1 FROM auth.users WHERE email = check_email) 
                       AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE email = check_email)
  );
$function$;