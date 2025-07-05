
-- Créer la table activity_logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique RLS : Les admins peuvent voir tous les logs
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Politique RLS : Seuls les admins peuvent insérer des logs (via triggers)
CREATE POLICY "Admins can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fonction helper pour logger les activités
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_dossier_id UUID DEFAULT NULL,
  p_action VARCHAR(100),
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    dossier_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_dossier_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- Trigger pour dossiers (création)
CREATE OR REPLACE FUNCTION public.log_dossier_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_user_activity(
    NEW.client_id,
    NEW.id,
    'dossier_cree',
    jsonb_build_object(
      'compagnie_assurance', NEW.compagnie_assurance,
      'type_sinistre', NEW.type_sinistre,
      'montant_refuse', NEW.montant_refuse
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_dossier_created
  AFTER INSERT ON public.dossiers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dossier_created();

-- Trigger pour dossiers (mise à jour du statut)
CREATE OR REPLACE FUNCTION public.log_dossier_status_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.statut != NEW.statut THEN
    PERFORM public.log_user_activity(
      NEW.client_id,
      NEW.id,
      'dossier_statut_modifie',
      jsonb_build_object(
        'ancien_statut', OLD.statut,
        'nouveau_statut', NEW.statut
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_dossier_status_updated
  AFTER UPDATE ON public.dossiers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dossier_status_updated();

-- Trigger pour courriers (génération)
CREATE OR REPLACE FUNCTION public.log_courrier_generated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id_var UUID;
BEGIN
  -- Récupérer l'ID du client via le dossier
  SELECT client_id INTO client_id_var
  FROM public.dossiers
  WHERE id = NEW.dossier_id;

  PERFORM public.log_user_activity(
    client_id_var,
    NEW.dossier_id,
    'courrier_genere',
    jsonb_build_object(
      'type_courrier', NEW.type_courrier,
      'statut', NEW.statut,
      'courrier_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_courrier_generated
  AFTER INSERT ON public.courriers_projets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_courrier_generated();

-- Trigger pour courriers (validation)
CREATE OR REPLACE FUNCTION public.log_courrier_validated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id_var UUID;
BEGIN
  IF OLD.statut != NEW.statut AND NEW.statut IN ('valide_pret_envoi', 'modifie_pret_envoi') THEN
    -- Récupérer l'ID du client via le dossier
    SELECT client_id INTO client_id_var
    FROM public.dossiers
    WHERE id = NEW.dossier_id;

    PERFORM public.log_user_activity(
      client_id_var,
      NEW.dossier_id,
      'courrier_valide',
      jsonb_build_object(
        'type_courrier', NEW.type_courrier,
        'statut', NEW.statut,
        'admin_validateur', NEW.admin_validateur,
        'courrier_id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_courrier_validated
  AFTER UPDATE ON public.courriers_projets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_courrier_validated();

-- Trigger pour paiements
CREATE OR REPLACE FUNCTION public.log_payment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_user_activity(
    NEW.client_id,
    NEW.dossier_id,
    'paiement_cree',
    jsonb_build_object(
      'montant', NEW.montant,
      'type_facturation', NEW.type_facturation,
      'statut', NEW.statut,
      'paiement_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_payment_created
  AFTER INSERT ON public.paiements
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_created();

-- Trigger pour paiements (changement de statut)
CREATE OR REPLACE FUNCTION public.log_payment_status_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.statut != NEW.statut THEN
    PERFORM public.log_user_activity(
      NEW.client_id,
      NEW.dossier_id,
      'paiement_statut_modifie',
      jsonb_build_object(
        'ancien_statut', OLD.statut,
        'nouveau_statut', NEW.statut,
        'montant', NEW.montant,
        'paiement_id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_payment_status_updated
  AFTER UPDATE ON public.paiements
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_status_updated();

-- Trigger pour documents (upload)
CREATE OR REPLACE FUNCTION public.log_document_uploaded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_user_activity(
    NEW.uploaded_by,
    NEW.dossier_id,
    'document_telecharge',
    jsonb_build_object(
      'nom_fichier', NEW.nom_fichier,
      'type_document', NEW.type_document,
      'taille_fichier', NEW.taille_fichier,
      'document_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_document_uploaded
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_uploaded();

-- Trigger pour échéances (création)
CREATE OR REPLACE FUNCTION public.log_echeance_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id_var UUID;
BEGIN
  -- Récupérer l'ID du client via le dossier
  SELECT client_id INTO client_id_var
  FROM public.dossiers
  WHERE id = NEW.dossier_id;

  PERFORM public.log_user_activity(
    client_id_var,
    NEW.dossier_id,
    'echeance_creee',
    jsonb_build_object(
      'type_echeance', NEW.type_echeance,
      'date_limite', NEW.date_limite,
      'description', NEW.description,
      'echeance_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_echeance_created
  AFTER INSERT ON public.echeances
  FOR EACH ROW
  EXECUTE FUNCTION public.log_echeance_created();

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_dossier_id ON public.activity_logs(dossier_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);
