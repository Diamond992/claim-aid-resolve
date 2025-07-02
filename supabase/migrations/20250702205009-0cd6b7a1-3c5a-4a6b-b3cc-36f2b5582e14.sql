
-- Create admin invitations table for secure admin registration
CREATE TABLE public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  invite_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on admin_invitations table
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_invitations table
CREATE POLICY "Admins can manage invitations"
  ON public.admin_invitations
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to generate secure invite codes
CREATE OR REPLACE FUNCTION public.generate_admin_invite(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create the first default admin user (change email and password as needed)
-- This creates a user directly in auth.users for initial setup
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if any admin exists
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    -- Insert a default admin user (you should change these credentials)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@reclamassur.com',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Admin","last_name":"System"}',
      now(),    
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;
    
    -- The triggers will automatically create the profile and assign user role
    -- Now update the role to admin
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = admin_user_id;
  END IF;
END $$;

-- Create audit log table for admin actions
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type text,
  target_user uuid DEFAULT NULL,
  action_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user, action_details);
END;
$$;
