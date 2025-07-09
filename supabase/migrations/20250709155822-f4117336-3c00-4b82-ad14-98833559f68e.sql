
-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to view all user roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));
