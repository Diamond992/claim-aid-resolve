
-- Créer les enums pour les types de courrier et statuts
CREATE TYPE public.type_courrier AS ENUM ('reclamation_interne', 'mediation', 'mise_en_demeure');
CREATE TYPE public.statut_courrier AS ENUM ('en_attente_validation', 'valide_pret_envoi', 'modifie_pret_envoi', 'envoye', 'rejete');

-- Créer la table courriers_projets
CREATE TABLE public.courriers_projets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  type_courrier type_courrier NOT NULL,
  contenu_genere TEXT NOT NULL,
  contenu_final TEXT,
  statut statut_courrier NOT NULL DEFAULT 'en_attente_validation',
  admin_validateur UUID REFERENCES public.profiles(id),
  numero_suivi VARCHAR(255),
  cout_envoi DECIMAL(10,2),
  reference_laposte VARCHAR(255),
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date_validation TIMESTAMP WITH TIME ZONE,
  date_envoi TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS sur la table
ALTER TABLE public.courriers_projets ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les clients (peuvent voir les courriers de leurs dossiers)
CREATE POLICY "Clients can view letters from their own dossiers" 
  ON public.courriers_projets 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE dossiers.id = courriers_projets.dossier_id 
    AND dossiers.client_id = auth.uid()
  ));

-- Politiques RLS pour les admins (peuvent tout voir et modifier)
CREATE POLICY "Admins can view all letters" 
  ON public.courriers_projets 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert letters" 
  ON public.courriers_projets 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all letters" 
  ON public.courriers_projets 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all letters" 
  ON public.courriers_projets 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_courriers_projets_updated_at 
  BEFORE UPDATE ON public.courriers_projets 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour notifier Make.com lors de la création d'un courrier
CREATE OR REPLACE FUNCTION public.notify_courrier_created()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID'; -- À remplacer par l'URL réelle
  payload JSON;
BEGIN
  -- Préparer le payload
  payload := json_build_object(
    'event', 'courrier_created',
    'courrier_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'type_courrier', NEW.type_courrier,
    'statut', NEW.statut,
    'date_creation', NEW.date_creation
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
    RAISE WARNING 'Failed to notify Make.com webhook for courrier creation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier Make.com lors de la validation d'un courrier
CREATE OR REPLACE FUNCTION public.notify_courrier_validated()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID'; -- À remplacer par l'URL réelle
  payload JSON;
BEGIN
  -- Vérifier si le statut a changé vers 'valide_pret_envoi' ou 'modifie_pret_envoi'
  IF OLD.statut != NEW.statut AND NEW.statut IN ('valide_pret_envoi', 'modifie_pret_envoi') THEN
    -- Préparer le payload
    payload := json_build_object(
      'event', 'courrier_validated',
      'courrier_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_courrier', NEW.type_courrier,
      'statut', NEW.statut,
      'admin_validateur', NEW.admin_validateur,
      'date_validation', NEW.date_validation
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
    RAISE WARNING 'Failed to notify Make.com webhook for courrier validation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier Make.com lors de l'envoi d'un courrier
CREATE OR REPLACE FUNCTION public.notify_courrier_sent()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID'; -- À remplacer par l'URL réelle
  payload JSON;
BEGIN
  -- Vérifier si le statut a changé vers 'envoye'
  IF OLD.statut != NEW.statut AND NEW.statut = 'envoye' THEN
    -- Préparer le payload
    payload := json_build_object(
      'event', 'courrier_sent',
      'courrier_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_courrier', NEW.type_courrier,
      'numero_suivi', NEW.numero_suivi,
      'reference_laposte', NEW.reference_laposte,
      'cout_envoi', NEW.cout_envoi,
      'date_envoi', NEW.date_envoi
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
    RAISE WARNING 'Failed to notify Make.com webhook for courrier sent: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer les triggers pour les notifications Make.com
CREATE TRIGGER notify_courrier_created_trigger
  AFTER INSERT ON public.courriers_projets
  FOR EACH ROW EXECUTE FUNCTION public.notify_courrier_created();

CREATE TRIGGER notify_courrier_validated_trigger
  AFTER UPDATE ON public.courriers_projets
  FOR EACH ROW EXECUTE FUNCTION public.notify_courrier_validated();

CREATE TRIGGER notify_courrier_sent_trigger
  AFTER UPDATE ON public.courriers_projets
  FOR EACH ROW EXECUTE FUNCTION public.notify_courrier_sent();
