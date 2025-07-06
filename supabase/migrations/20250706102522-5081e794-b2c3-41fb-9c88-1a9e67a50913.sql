
-- Ajouter les contraintes de clé étrangère avec ON DELETE CASCADE

-- dossiers.client_id → profiles.id
ALTER TABLE public.dossiers
ADD CONSTRAINT fk_dossiers_client_id
FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- documents.dossier_id → dossiers.id
ALTER TABLE public.documents
ADD CONSTRAINT fk_documents_dossier_id
FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE CASCADE;

-- documents.uploaded_by → profiles.id
ALTER TABLE public.documents
ADD CONSTRAINT fk_documents_uploaded_by
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- courriers_projets.dossier_id → dossiers.id
ALTER TABLE public.courriers_projets
ADD CONSTRAINT fk_courriers_projets_dossier_id
FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE CASCADE;

-- courriers_projets.admin_validateur → profiles.id
ALTER TABLE public.courriers_projets
ADD CONSTRAINT fk_courriers_projets_admin_validateur
FOREIGN KEY (admin_validateur) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- echeances.dossier_id → dossiers.id
ALTER TABLE public.echeances
ADD CONSTRAINT fk_echeances_dossier_id
FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE CASCADE;

-- paiements.dossier_id → dossiers.id (ON DELETE SET NULL car un paiement peut exister sans dossier)
ALTER TABLE public.paiements
ADD CONSTRAINT fk_paiements_dossier_id
FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE SET NULL;

-- paiements.client_id → profiles.id
ALTER TABLE public.paiements
ADD CONSTRAINT fk_paiements_client_id
FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- activity_logs.user_id → profiles.id
ALTER TABLE public.activity_logs
ADD CONSTRAINT fk_activity_logs_user_id
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- activity_logs.dossier_id → dossiers.id (ON DELETE SET NULL car un log peut exister sans dossier)
ALTER TABLE public.activity_logs
ADD CONSTRAINT fk_activity_logs_dossier_id
FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE SET NULL;

-- configuration.updated_by → profiles.id
ALTER TABLE public.configuration
ADD CONSTRAINT fk_configuration_updated_by
FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- modeles_courriers.created_by → profiles.id
ALTER TABLE public.modeles_courriers
ADD CONSTRAINT fk_modeles_courriers_created_by
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
