
-- Créer la fonction get_user_role pour récupérer le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_roles.user_id = get_user_role.user_id
  LIMIT 1;
$$;

-- Créer la fonction is_owner pour vérifier la propriété d'un dossier
CREATE OR REPLACE FUNCTION public.is_owner(dossier_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dossiers
    WHERE dossiers.id = is_owner.dossier_id
      AND dossiers.client_id = is_owner.user_id
  );
$$;

-- Créer la fonction can_access_dossier qui combine rôle et propriété
CREATE OR REPLACE FUNCTION public.can_access_dossier(dossier_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    public.get_user_role(can_access_dossier.user_id) = 'admin'::app_role
    OR 
    public.is_owner(can_access_dossier.dossier_id, can_access_dossier.user_id);
$$;

-- Créer la fonction is_admin simplifiée utilisant get_user_role
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.get_user_role(COALESCE(is_admin.user_id, auth.uid())) = 'admin'::app_role;
$$;

-- Créer la fonction encrypt_sensitive_data pour chiffrer les données sensibles
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN data IS NULL OR data = '' THEN data
    ELSE encode(encrypt(data::bytea, 'encryption_key', 'aes'), 'base64')
  END;
$$;

-- Créer la fonction decrypt_sensitive_data pour déchiffrer les données sensibles
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN encrypted_data IS NULL OR encrypted_data = '' THEN encrypted_data
    ELSE convert_from(decrypt(decode(encrypted_data, 'base64'), 'encryption_key', 'aes'), 'UTF8')
  END;
$$;

-- Mettre à jour les politiques RLS pour la table dossiers
DROP POLICY IF EXISTS "Clients can view their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Clients can create their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Clients can update their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Clients can delete their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Admins can view all dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Admins can update all dossiers" ON public.dossiers;

CREATE POLICY "Users can view accessible dossiers" 
  ON public.dossiers 
  FOR SELECT 
  USING (public.can_access_dossier(id, auth.uid()));

CREATE POLICY "Users can create their own dossiers" 
  ON public.dossiers 
  FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update accessible dossiers" 
  ON public.dossiers 
  FOR UPDATE 
  USING (public.can_access_dossier(id, auth.uid()));

CREATE POLICY "Owners can delete their dossiers" 
  ON public.dossiers 
  FOR DELETE 
  USING (public.is_owner(id, auth.uid()));

-- Mettre à jour les politiques RLS pour la table documents
DROP POLICY IF EXISTS "Users can view documents from their own dossiers" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents to their own dossiers" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete all documents" ON public.documents;

CREATE POLICY "Users can view documents from accessible dossiers" 
  ON public.documents 
  FOR SELECT 
  USING (public.can_access_dossier(dossier_id, auth.uid()));

CREATE POLICY "Users can upload documents to accessible dossiers" 
  ON public.documents 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = uploaded_by 
    AND public.can_access_dossier(dossier_id, auth.uid())
  );

CREATE POLICY "Users can update their own documents in accessible dossiers" 
  ON public.documents 
  FOR UPDATE 
  USING (
    auth.uid() = uploaded_by 
    AND public.can_access_dossier(dossier_id, auth.uid())
  );

CREATE POLICY "Users can delete their own documents in accessible dossiers" 
  ON public.documents 
  FOR DELETE 
  USING (
    auth.uid() = uploaded_by 
    AND public.can_access_dossier(dossier_id, auth.uid())
  );

-- Mettre à jour les politiques RLS pour la table paiements
DROP POLICY IF EXISTS "Clients can view their own payments" ON public.paiements;
DROP POLICY IF EXISTS "Clients can insert their own payments" ON public.paiements;
DROP POLICY IF EXISTS "Clients can update their own payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can insert payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can delete all payments" ON public.paiements;

CREATE POLICY "Users can view accessible payments" 
  ON public.paiements 
  FOR SELECT 
  USING (
    public.is_admin(auth.uid()) 
    OR auth.uid() = client_id
  );

CREATE POLICY "Users can insert their own payments" 
  ON public.paiements 
  FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update accessible payments" 
  ON public.paiements 
  FOR UPDATE 
  USING (
    public.is_admin(auth.uid()) 
    OR auth.uid() = client_id
  );

CREATE POLICY "Admins can delete payments" 
  ON public.paiements 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));

-- Mettre à jour les politiques RLS pour la table echeances
DROP POLICY IF EXISTS "Clients can view deadlines from their own dossiers" ON public.echeances;
DROP POLICY IF EXISTS "Admins can view all deadlines" ON public.echeances;
DROP POLICY IF EXISTS "Admins can insert deadlines" ON public.echeances;
DROP POLICY IF EXISTS "Admins can update all deadlines" ON public.echeances;
DROP POLICY IF EXISTS "Admins can delete all deadlines" ON public.echeances;

CREATE POLICY "Users can view deadlines from accessible dossiers" 
  ON public.echeances 
  FOR SELECT 
  USING (public.can_access_dossier(dossier_id, auth.uid()));

CREATE POLICY "Admins can manage deadlines" 
  ON public.echeances 
  FOR ALL 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Mettre à jour les politiques RLS pour la table courriers_projets
DROP POLICY IF EXISTS "Clients can view letters from their own dossiers" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can view all letters" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can insert letters" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can update all letters" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can delete all letters" ON public.courriers_projets;

CREATE POLICY "Users can view letters from accessible dossiers" 
  ON public.courriers_projets 
  FOR SELECT 
  USING (public.can_access_dossier(dossier_id, auth.uid()));

CREATE POLICY "Admins can manage letters" 
  ON public.courriers_projets 
  FOR ALL 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
