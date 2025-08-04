-- Solution radicale pour éliminer les timeouts d'upload de documents
-- Remplacer toutes les policies par des vérifications inline ultra-simples

-- 1. Supprimer toutes les policies existantes sur documents
DROP POLICY IF EXISTS "Users can upload documents to accessible dossiers optimized" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents from accessible dossiers optimized" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents optimized" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents optimized" ON public.documents;

-- 2. Créer des policies ultra-simples avec une seule requête inline pour l'insertion
CREATE POLICY "Ultra simple document insert" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by 
  AND EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE id = dossier_id AND client_id = auth.uid()
  )
);

-- 3. Policy de sélection simplifiée (propriétaire du dossier seulement)
CREATE POLICY "Ultra simple document select" 
ON public.documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE id = dossier_id AND client_id = auth.uid()
  )
);

-- 4. Policy d'update simplifiée
CREATE POLICY "Ultra simple document update" 
ON public.documents 
FOR UPDATE 
USING (
  auth.uid() = uploaded_by 
  AND EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE id = dossier_id AND client_id = auth.uid()
  )
);

-- 5. Policy de delete simplifiée
CREATE POLICY "Ultra simple document delete" 
ON public.documents 
FOR DELETE 
USING (
  auth.uid() = uploaded_by 
  AND EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE id = dossier_id AND client_id = auth.uid()
  )
);

-- 6. Policies admin séparées pour éviter la complexité dans les policies principales
CREATE POLICY "Admin can view all documents" 
ON public.documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admin can manage all documents" 
ON public.documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- 7. Supprimer la fonction qui n'est plus nécessaire
DROP FUNCTION IF EXISTS public.can_insert_document_optimized(uuid, uuid);