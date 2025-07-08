
-- Créer les fonctions helper pour la gestion des rôles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role::TEXT 
  FROM public.user_roles 
  WHERE user_roles.user_id = COALESCE($1, auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = COALESCE($1, auth.uid())
    AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = COALESCE($1, auth.uid())
    AND role = 'super_admin'
  );
$$;

-- Nettoyer les anciennes politiques et en créer de nouvelles

-- TABLE: profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can delete profiles" 
  ON public.profiles FOR DELETE 
  USING (public.is_admin());

-- TABLE: user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage user roles" 
  ON public.user_roles FOR ALL 
  USING (public.is_admin());

-- TABLE: dossiers
DROP POLICY IF EXISTS "Clients can view their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Clients can create their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Clients can update their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Clients can delete their own dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Admins can view all dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Admins can update all dossiers" ON public.dossiers;

CREATE POLICY "Clients can view their own dossiers" 
  ON public.dossiers FOR SELECT 
  USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Clients can create their own dossiers" 
  ON public.dossiers FOR INSERT 
  WITH CHECK (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Clients can update their own dossiers" 
  ON public.dossiers FOR UPDATE 
  USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Admins can delete dossiers" 
  ON public.dossiers FOR DELETE 
  USING (public.is_admin());

-- TABLE: documents
DROP POLICY IF EXISTS "Users can view documents from their own dossiers" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents to their own dossiers" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete all documents" ON public.documents;

CREATE POLICY "Users can view documents from their own dossiers" 
  ON public.documents FOR SELECT 
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.dossiers 
      WHERE dossiers.id = documents.dossier_id 
      AND dossiers.client_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their own dossiers" 
  ON public.documents FOR INSERT 
  WITH CHECK (
    public.is_admin() OR
    (auth.uid() = uploaded_by AND
     EXISTS (
       SELECT 1 FROM public.dossiers 
       WHERE dossiers.id = documents.dossier_id 
       AND dossiers.client_id = auth.uid()
     ))
  );

CREATE POLICY "Users can update their own documents" 
  ON public.documents FOR UPDATE 
  USING (
    public.is_admin() OR
    (auth.uid() = uploaded_by AND
     EXISTS (
       SELECT 1 FROM public.dossiers 
       WHERE dossiers.id = documents.dossier_id 
       AND dossiers.client_id = auth.uid()
     ))
  );

CREATE POLICY "Users can delete their own documents" 
  ON public.documents FOR DELETE 
  USING (
    public.is_admin() OR
    (auth.uid() = uploaded_by AND
     EXISTS (
       SELECT 1 FROM public.dossiers 
       WHERE dossiers.id = documents.dossier_id 
       AND dossiers.client_id = auth.uid()
     ))
  );

-- TABLE: courriers_projets
DROP POLICY IF EXISTS "Clients can view letters from their own dossiers" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can view all letters" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can insert letters" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can update all letters" ON public.courriers_projets;
DROP POLICY IF EXISTS "Admins can delete all letters" ON public.courriers_projets;

CREATE POLICY "Clients can view letters from their own dossiers" 
  ON public.courriers_projets FOR SELECT 
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.dossiers 
      WHERE dossiers.id = courriers_projets.dossier_id 
      AND dossiers.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all letters" 
  ON public.courriers_projets FOR ALL 
  USING (public.is_admin());

-- TABLE: echeances
DROP POLICY IF EXISTS "Clients can view deadlines from their own dossiers" ON public.echeances;
DROP POLICY IF EXISTS "Admins can view all deadlines" ON public.echeances;
DROP POLICY IF EXISTS "Admins can insert deadlines" ON public.echeances;
DROP POLICY IF EXISTS "Admins can update all deadlines" ON public.echeances;
DROP POLICY IF EXISTS "Admins can delete all deadlines" ON public.echeances;

CREATE POLICY "Clients can view deadlines from their own dossiers" 
  ON public.echeances FOR SELECT 
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.dossiers 
      WHERE dossiers.id = echeances.dossier_id 
      AND dossiers.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all deadlines" 
  ON public.echeances FOR ALL 
  USING (public.is_admin());

-- TABLE: paiements
DROP POLICY IF EXISTS "Clients can view their own payments" ON public.paiements;
DROP POLICY IF EXISTS "Clients can insert their own payments" ON public.paiements;
DROP POLICY IF EXISTS "Clients can update their own payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can insert payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.paiements;
DROP POLICY IF EXISTS "Admins can delete all payments" ON public.paiements;

CREATE POLICY "Clients can view their own payments" 
  ON public.paiements FOR SELECT 
  USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Clients can insert their own payments" 
  ON public.paiements FOR INSERT 
  WITH CHECK (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Clients can update their own payments" 
  ON public.paiements FOR UPDATE 
  USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Admins can delete payments" 
  ON public.paiements FOR DELETE 
  USING (public.is_admin());

-- TABLE: modeles_courriers
DROP POLICY IF EXISTS "Admins can view all templates" ON public.modeles_courriers;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.modeles_courriers;
DROP POLICY IF EXISTS "Admins can update all templates" ON public.modeles_courriers;
DROP POLICY IF EXISTS "Admins can delete all templates" ON public.modeles_courriers;

CREATE POLICY "Admins can manage all templates" 
  ON public.modeles_courriers FOR ALL 
  USING (public.is_admin());

-- TABLE: configuration
DROP POLICY IF EXISTS "Admins can view all configurations" ON public.configuration;
DROP POLICY IF EXISTS "Admins can insert configurations" ON public.configuration;
DROP POLICY IF EXISTS "Admins can update all configurations" ON public.configuration;
DROP POLICY IF EXISTS "Admins can delete all configurations" ON public.configuration;

CREATE POLICY "Admins can view all configurations" 
  ON public.configuration FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Super admins can manage configurations" 
  ON public.configuration FOR INSERT 
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update configurations" 
  ON public.configuration FOR UPDATE 
  USING (public.is_super_admin());

CREATE POLICY "Super admins can delete configurations" 
  ON public.configuration FOR DELETE 
  USING (public.is_super_admin());

-- TABLE: admin_audit_log
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;

CREATE POLICY "Admins can view audit logs" 
  ON public.admin_audit_log FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs" 
  ON public.admin_audit_log FOR INSERT 
  WITH CHECK (public.is_admin());

-- TABLE: admin_invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.admin_invitations;

CREATE POLICY "Super admins can manage invitations" 
  ON public.admin_invitations FOR ALL 
  USING (public.is_super_admin());

-- TABLE: webhook_logs
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;

CREATE POLICY "Admins can view webhook logs" 
  ON public.webhook_logs FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "System can insert webhook logs" 
  ON public.webhook_logs FOR INSERT 
  WITH CHECK (true); -- Permet aux fonctions système d'insérer des logs

-- Mettre à jour la fonction has_role existante pour utiliser les nouvelles fonctions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
