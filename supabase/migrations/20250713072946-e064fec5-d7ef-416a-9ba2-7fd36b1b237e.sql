-- Améliorer la politique RLS pour les insertions de dossiers
-- Permettre l'insertion si l'utilisateur est authentifié et que client_id correspond à auth.uid()

DROP POLICY IF EXISTS "Users can create their own dossiers" ON public.dossiers;

CREATE POLICY "Users can create their own dossiers" 
ON public.dossiers 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = client_id
);

-- Vérifier que la fonction can_access_dossier fonctionne correctement
-- et créer une version plus robuste si nécessaire
CREATE OR REPLACE FUNCTION public.can_access_dossier_safe(dossier_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN user_id IS NULL THEN false
    ELSE (
      public.get_user_role(user_id) = 'admin'::app_role
      OR 
      public.is_owner(dossier_id, user_id)
    )
  END;
$$;