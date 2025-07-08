
-- Supprimer la valeur 'super_admin' de l'enum app_role
-- Attention: cela supprimera définitivement tous les utilisateurs avec le rôle super_admin
DELETE FROM public.user_roles WHERE role = 'super_admin';

-- Mettre à jour les politiques RLS pour utiliser is_admin() au lieu de is_super_admin()
DROP POLICY IF EXISTS "Super admins can manage invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Super admins can manage configurations" ON public.configuration;
DROP POLICY IF EXISTS "Super admins can update configurations" ON public.configuration;
DROP POLICY IF EXISTS "Super admins can delete configurations" ON public.configuration;

-- Recréer les politiques pour les invitations (admins seulement)
CREATE POLICY "Admins can manage invitations" 
  ON public.admin_invitations FOR ALL 
  USING (public.is_admin());

-- Recréer les politiques pour la configuration (admins pour modification)
CREATE POLICY "Admins can manage configurations" 
  ON public.configuration FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update configurations" 
  ON public.configuration FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Admins can delete configurations" 
  ON public.configuration FOR DELETE 
  USING (public.is_admin());

-- Supprimer la fonction is_super_admin devenue inutile
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

-- Note: On ne peut pas supprimer directement une valeur d'un enum en PostgreSQL
-- La valeur 'super_admin' restera dans l'enum mais ne sera plus utilisée
