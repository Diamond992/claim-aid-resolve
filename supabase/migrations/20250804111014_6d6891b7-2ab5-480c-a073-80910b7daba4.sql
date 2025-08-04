-- Optimisation des policies RLS et index pour résoudre les timeouts d'upload

-- 1. Ajouter l'index manquant sur user_roles.user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 2. Créer une fonction optimisée pour la validation d'insertion de documents
CREATE OR REPLACE FUNCTION public.can_insert_document_optimized(dossier_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Vérification directe : l'utilisateur est-il propriétaire du dossier ?
  SELECT EXISTS (
    SELECT 1
    FROM public.dossiers d
    WHERE d.id = dossier_id 
      AND d.client_id = user_id
  )
  -- OU est-il admin ?
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = user_id 
      AND ur.role = 'admin'::app_role
  );
$$;

-- 3. Supprimer l'ancienne policy d'insertion pour documents
DROP POLICY IF EXISTS "Users can upload documents to accessible dossiers" ON public.documents;

-- 4. Créer une nouvelle policy d'insertion optimisée
CREATE POLICY "Users can upload documents to accessible dossiers optimized" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by 
  AND can_insert_document_optimized(dossier_id, auth.uid())
);

-- 5. Optimiser aussi la policy de sélection pour éviter les appels coûteux
DROP POLICY IF EXISTS "Users can view documents from accessible dossiers" ON public.documents;

CREATE POLICY "Users can view documents from accessible dossiers optimized" 
ON public.documents 
FOR SELECT 
USING (
  -- Propriétaire du dossier
  EXISTS (
    SELECT 1
    FROM public.dossiers d
    WHERE d.id = dossier_id 
      AND d.client_id = auth.uid()
  )
  -- OU admin
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
  )
);

-- 6. Optimiser les policies UPDATE et DELETE de la même manière
DROP POLICY IF EXISTS "Users can update their own documents in accessible dossiers" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents in accessible dossiers" ON public.documents;

CREATE POLICY "Users can update their own documents optimized" 
ON public.documents 
FOR UPDATE 
USING (
  auth.uid() = uploaded_by 
  AND (
    -- Propriétaire du dossier
    EXISTS (
      SELECT 1
      FROM public.dossiers d
      WHERE d.id = dossier_id 
        AND d.client_id = auth.uid()
    )
    -- OU admin
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin'::app_role
    )
  )
);

CREATE POLICY "Users can delete their own documents optimized" 
ON public.documents 
FOR DELETE 
USING (
  auth.uid() = uploaded_by 
  AND (
    -- Propriétaire du dossier
    EXISTS (
      SELECT 1
      FROM public.dossiers d
      WHERE d.id = dossier_id 
        AND d.client_id = auth.uid()
    )
    -- OU admin
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin'::app_role
    )
  )
);