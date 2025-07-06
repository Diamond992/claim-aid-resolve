
-- Créer des index optimaux pour les requêtes fréquentes

-- Index sur dossiers.client_id (pour les requêtes par client)
CREATE INDEX idx_dossiers_client_id ON public.dossiers(client_id);

-- Index sur dossiers.statut (pour filtrer par statut)
CREATE INDEX idx_dossiers_statut ON public.dossiers(statut);

-- Index composite sur dossiers(client_id, statut) pour les requêtes combinées
CREATE INDEX idx_dossiers_client_statut ON public.dossiers(client_id, statut);

-- Index sur documents.dossier_id (pour récupérer les documents d'un dossier)
CREATE INDEX idx_documents_dossier_id ON public.documents(dossier_id);

-- Index sur courriers_projets.dossier_id (pour récupérer les courriers d'un dossier)
CREATE INDEX idx_courriers_projets_dossier_id ON public.courriers_projets(dossier_id);

-- Index sur courriers_projets.statut (pour filtrer par statut)
CREATE INDEX idx_courriers_projets_statut ON public.courriers_projets(statut);

-- Index composite sur courriers_projets(dossier_id, statut) pour les requêtes combinées
CREATE INDEX idx_courriers_projets_dossier_statut ON public.courriers_projets(dossier_id, statut);

-- Index sur echeances.date_limite (pour les requêtes par date limite)
CREATE INDEX idx_echeances_date_limite ON public.echeances(date_limite);

-- Index sur echeances.statut (pour filtrer par statut)
CREATE INDEX idx_echeances_statut ON public.echeances(statut);

-- Index composite sur echeances(date_limite, statut) pour les alertes
CREATE INDEX idx_echeances_date_statut ON public.echeances(date_limite, statut);

-- Index composite sur paiements(client_id, statut) pour les requêtes de paiement par client
CREATE INDEX idx_paiements_client_statut ON public.paiements(client_id, statut);

-- Index sur activity_logs.created_at pour la pagination et tri chronologique
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Index composite sur activity_logs(user_id, created_at) pour les logs par utilisateur
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);

-- Index sur echeances.dossier_id pour récupérer les échéances d'un dossier
CREATE INDEX idx_echeances_dossier_id ON public.echeances(dossier_id);

-- Index sur courriers_projets.admin_validateur pour les requêtes par validateur
CREATE INDEX idx_courriers_projets_admin_validateur ON public.courriers_projets(admin_validateur);

-- Index sur documents.uploaded_by pour les requêtes par uploader
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Index sur dossiers.created_at pour tri chronologique
CREATE INDEX idx_dossiers_created_at ON public.dossiers(created_at DESC);
