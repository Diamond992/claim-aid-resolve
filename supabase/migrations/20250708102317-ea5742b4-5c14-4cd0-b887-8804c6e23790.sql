
-- Ajouter 'super_admin' à l'enum app_role existant
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Mettre à jour les politiques RLS pour utiliser les nouvelles fonctions helper
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Super admins can manage configurations" ON public.configuration;
DROP POLICY IF EXISTS "Super admins can update configurations" ON public.configuration;
DROP POLICY IF EXISTS "Super admins can delete configurations" ON public.configuration;

-- Recréer les politiques pour les invitations (super admins seulement)
CREATE POLICY "Super admins can manage invitations" 
  ON public.admin_invitations FOR ALL 
  USING (public.is_super_admin());

-- Recréer les politiques pour la configuration (super admins pour modification)
CREATE POLICY "Super admins can manage configurations" 
  ON public.configuration FOR INSERT 
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update configurations" 
  ON public.configuration FOR UPDATE 
  USING (public.is_super_admin());

CREATE POLICY "Super admins can delete configurations" 
  ON public.configuration FOR DELETE 
  USING (public.is_super_admin());
