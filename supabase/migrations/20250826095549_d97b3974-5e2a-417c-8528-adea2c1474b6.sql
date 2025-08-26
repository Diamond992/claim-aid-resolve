-- Fix the generate_admin_invite function to use gen_random_uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_admin_invite(admin_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_code text;
BEGIN
  -- Generate a secure random invite code using gen_random_uuid
  invite_code := replace(replace(gen_random_uuid()::text, '-', ''), '_', '') || replace(replace(gen_random_uuid()::text, '-', ''), '_', '');
  invite_code := substring(invite_code from 1 for 32);
  
  -- Insert the invitation
  INSERT INTO public.admin_invitations (email, invite_code, created_by)
  VALUES (admin_email, invite_code, auth.uid());
  
  RETURN invite_code;
END;
$function$