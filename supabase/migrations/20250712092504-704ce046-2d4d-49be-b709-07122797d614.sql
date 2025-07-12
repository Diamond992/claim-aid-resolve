-- Add DELETE policies for user management

-- Allow admins to delete user profiles
CREATE POLICY "Admins can delete user profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Allow admins to delete user roles  
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE 
USING (is_admin(auth.uid()));

-- Allow admins to update user roles (needed for role changes)
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Allow admins to insert user roles (needed for role assignment)
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));