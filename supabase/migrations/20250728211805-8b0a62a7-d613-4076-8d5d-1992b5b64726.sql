-- Amélioration de la politique RLS pour les dossiers avec une meilleure gestion d'authentification
-- Suppression de l'ancienne politique qui pourrait causer des problèmes
DROP POLICY IF EXISTS "Users can create their own dossiers" ON public.dossiers;

-- Nouvelle politique plus robuste avec vérification explicite de l'authentification
CREATE POLICY "Users can create their own dossiers"
ON public.dossiers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = client_id
  AND auth.jwt() IS NOT NULL
);

-- Fonction utilitaire pour vérifier l'état d'authentification avant insertion
CREATE OR REPLACE FUNCTION public.verify_auth_before_insert()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.uid() IS NOT NULL AND auth.jwt() IS NOT NULL;
$$;