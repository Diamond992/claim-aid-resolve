-- Supprimer l'ancienne politique de suppression
DROP POLICY "Users can delete their documents in accessible dossiers" ON public.documents;

-- Créer la nouvelle politique qui inclut les administrateurs
CREATE POLICY "Users and admins can delete documents" 
ON public.documents 
FOR DELETE 
USING (
  is_admin(auth.uid()) OR 
  (can_access_dossier(dossier_id, auth.uid()) AND (auth.uid() = uploaded_by))
);