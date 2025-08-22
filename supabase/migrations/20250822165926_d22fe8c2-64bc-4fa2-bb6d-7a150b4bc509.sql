-- Create secure function to delete user completely
CREATE OR REPLACE FUNCTION public.secure_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  admin_user_id uuid;
  current_user_role app_role;
  dossier_ids uuid[];
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
  
  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
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
  -- (This maintains RLS context since admin is still authenticated)
  
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
  
  -- Step 2: Delete from auth.users using the auth schema
  -- This requires special privileges that only SECURITY DEFINER functions have
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Log successful deletion
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    admin_user_id, 
    'user_deleted_complete', 
    target_user_id, 
    jsonb_build_object(
      'timestamp', now(),
      'step', 'deletion_completed',
      'dossiers_deleted', COALESCE(array_length(dossier_ids, 1), 0)
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