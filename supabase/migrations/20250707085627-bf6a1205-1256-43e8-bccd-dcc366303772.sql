
-- Créer la table activity_logs pour tracer toutes les activités
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes sur activity_logs
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_table_name ON public.activity_logs(table_name);

-- Activer RLS sur activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour que les admins puissent voir tous les logs
CREATE POLICY "Admins can view all activity logs" 
  ON public.activity_logs 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

-- Fonction générique pour logger les activités
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  )
  VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$;

-- Fonction générique pour logger automatiquement les changements
CREATE OR REPLACE FUNCTION public.auto_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_type TEXT;
  old_values JSONB;
  new_values JSONB;
  record_id UUID;
BEGIN
  -- Déterminer le type d'action
  IF TG_OP = 'INSERT' THEN
    action_type := 'INSERT';
    new_values := to_jsonb(NEW);
    record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
    old_values := to_jsonb(OLD);
    new_values := to_jsonb(NEW);
    record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
    old_values := to_jsonb(OLD);
    record_id := OLD.id;
  END IF;

  -- Logger l'activité
  PERFORM public.log_activity(
    action_type,
    TG_TABLE_NAME,
    record_id,
    old_values,
    new_values
  );

  -- Retourner la ligne appropriée
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Fonction pour créer automatiquement les échéances lors de la création d'un dossier
CREATE OR REPLACE FUNCTION public.create_default_echeances()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Créer échéance de réponse réclamation (2 mois)
  INSERT INTO public.echeances (
    dossier_id,
    type_echeance,
    date_limite,
    description
  )
  VALUES (
    NEW.id,
    'reponse_reclamation',
    NEW.created_at::date + INTERVAL '2 months',
    'Délai de réponse de l''assureur à la réclamation interne'
  );

  -- Créer échéance de prescription biennale (2 ans)
  INSERT INTO public.echeances (
    dossier_id,
    type_echeance,
    date_limite,
    description
  )
  VALUES (
    NEW.id,
    'prescription_biennale',
    NEW.date_sinistre + INTERVAL '2 years',
    'Prescription biennale pour action en responsabilité'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Trigger sur documents AFTER INSERT pour notifier Make.com
-- (Déjà existant, on le garde tel quel)

-- 2. Trigger sur courriers_projets AFTER UPDATE pour envoi automatique
-- (Les triggers notify_courrier_validated et notify_courrier_sent existent déjà)

-- 3. Triggers sur toutes les tables principales pour logs automatiques
CREATE TRIGGER auto_log_dossiers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.dossiers
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_changes();

CREATE TRIGGER auto_log_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_changes();

CREATE TRIGGER auto_log_courriers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.courriers_projets
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_changes();

CREATE TRIGGER auto_log_echeances_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.echeances
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_changes();

CREATE TRIGGER auto_log_paiements_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_changes();

-- 4. Trigger sur echeances pour calcul automatique de date_alerte
-- (Le trigger calculate_date_alerte_trigger existe déjà)

-- 5. Trigger sur dossiers pour création automatique des échéances
CREATE TRIGGER create_default_echeances_trigger
  AFTER INSERT ON public.dossiers
  FOR EACH ROW EXECUTE FUNCTION public.create_default_echeances();
