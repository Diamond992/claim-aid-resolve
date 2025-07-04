
-- Créer les enums pour les types d'échéances et statuts
CREATE TYPE public.type_echeance AS ENUM ('reponse_reclamation', 'delai_mediation', 'prescription_biennale');
CREATE TYPE public.statut_echeance AS ENUM ('actif', 'traite', 'expire');

-- Créer la table echeances
CREATE TABLE public.echeances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  type_echeance type_echeance NOT NULL,
  date_limite DATE NOT NULL,
  date_alerte DATE,
  statut statut_echeance NOT NULL DEFAULT 'actif',
  description TEXT,
  notifie BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS sur la table
ALTER TABLE public.echeances ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les clients (peuvent voir les échéances de leurs dossiers)
CREATE POLICY "Clients can view deadlines from their own dossiers" 
  ON public.echeances 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE dossiers.id = echeances.dossier_id 
    AND dossiers.client_id = auth.uid()
  ));

-- Politiques RLS pour les admins (peuvent tout voir et modifier)
CREATE POLICY "Admins can view all deadlines" 
  ON public.echeances 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert deadlines" 
  ON public.echeances 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all deadlines" 
  ON public.echeances 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all deadlines" 
  ON public.echeances 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_echeances_updated_at 
  BEFORE UPDATE ON public.echeances 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer automatiquement date_alerte (15 jours avant date_limite)
CREATE OR REPLACE FUNCTION public.calculate_date_alerte()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer date_alerte comme 15 jours avant date_limite
  NEW.date_alerte := NEW.date_limite - INTERVAL '15 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement date_alerte lors de l'insertion ou mise à jour
CREATE TRIGGER calculate_date_alerte_trigger
  BEFORE INSERT OR UPDATE ON public.echeances
  FOR EACH ROW EXECUTE FUNCTION public.calculate_date_alerte();

-- Fonction pour notifier Make.com lors de la création d'une échéance
CREATE OR REPLACE FUNCTION public.notify_echeance_created()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID'; -- À remplacer par l'URL réelle
  payload JSON;
BEGIN
  -- Préparer le payload
  payload := json_build_object(
    'event', 'echeance_created',
    'echeance_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'type_echeance', NEW.type_echeance,
    'date_limite', NEW.date_limite,
    'date_alerte', NEW.date_alerte,
    'statut', NEW.statut,
    'description', NEW.description,
    'created_at', NEW.created_at
  );

  -- Faire la requête HTTP vers Make.com (nécessite l'extension pg_net)
  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload::jsonb
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas faire échouer l'insertion
    RAISE WARNING 'Failed to notify Make.com webhook for echeance creation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier Make.com lors de l'approche d'une échéance
CREATE OR REPLACE FUNCTION public.notify_echeance_alert()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID'; -- À remplacer par l'URL réelle
  payload JSON;
BEGIN
  -- Vérifier si on approche de la date d'alerte et que ce n'est pas encore notifié
  IF NEW.statut = 'actif' AND NEW.date_alerte <= CURRENT_DATE AND OLD.notifie = FALSE AND NEW.notifie = TRUE THEN
    -- Préparer le payload
    payload := json_build_object(
      'event', 'echeance_alert',
      'echeance_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_echeance', NEW.type_echeance,
      'date_limite', NEW.date_limite,
      'date_alerte', NEW.date_alerte,
      'description', NEW.description,
      'jours_restants', (NEW.date_limite - CURRENT_DATE)
    );

    -- Faire la requête HTTP vers Make.com
    PERFORM net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload::jsonb
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas faire échouer la mise à jour
    RAISE WARNING 'Failed to notify Make.com webhook for echeance alert: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier Make.com lors du changement de statut d'une échéance
CREATE OR REPLACE FUNCTION public.notify_echeance_status_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID'; -- À remplacer par l'URL réelle
  payload JSON;
BEGIN
  -- Vérifier si le statut a changé
  IF OLD.statut != NEW.statut THEN
    -- Préparer le payload
    payload := json_build_object(
      'event', 'echeance_status_changed',
      'echeance_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_echeance', NEW.type_echeance,
      'ancien_statut', OLD.statut,
      'nouveau_statut', NEW.statut,
      'date_limite', NEW.date_limite,
      'description', NEW.description,
      'updated_at', NEW.updated_at
    );

    -- Faire la requête HTTP vers Make.com
    PERFORM net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload::jsonb
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas faire échouer la mise à jour
    RAISE WARNING 'Failed to notify Make.com webhook for echeance status change: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer les triggers pour les notifications Make.com
CREATE TRIGGER notify_echeance_created_trigger
  AFTER INSERT ON public.echeances
  FOR EACH ROW EXECUTE FUNCTION public.notify_echeance_created();

CREATE TRIGGER notify_echeance_alert_trigger
  AFTER UPDATE ON public.echeances
  FOR EACH ROW EXECUTE FUNCTION public.notify_echeance_alert();

CREATE TRIGGER notify_echeance_status_change_trigger
  AFTER UPDATE ON public.echeances
  FOR EACH ROW EXECUTE FUNCTION public.notify_echeance_status_change();
