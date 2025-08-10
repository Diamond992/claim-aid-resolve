-- Create table to store webhook endpoints per event (for n8n or others)
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS and restrict to admins
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'webhook_endpoints' AND policyname = 'Admins can manage webhook endpoints'
  ) THEN
    CREATE POLICY "Admins can manage webhook endpoints"
    ON public.webhook_endpoints
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Central function to notify all active endpoints for a given event
CREATE OR REPLACE FUNCTION public.notify_webhook_by_event(event_name text, payload_json jsonb, max_retries integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  endpoint RECORD;
  success BOOLEAN := TRUE;
  call_success BOOLEAN;
BEGIN
  FOR endpoint IN
    SELECT url FROM public.webhook_endpoints
    WHERE event = event_name AND active = TRUE
  LOOP
    BEGIN
      call_success := public.notify_make_webhook(endpoint.url, payload_json, max_retries);
    EXCEPTION WHEN OTHERS THEN
      call_success := FALSE;
    END;

    -- We don't block on failure, but we mark overall success accordingly
    IF NOT call_success THEN
      success := FALSE;
    END IF;
  END LOOP;

  RETURN success;
END;
$$;

-- Update existing notifier functions to use the new central dispatcher and remove hardcoded URLs

CREATE OR REPLACE FUNCTION public.notify_courrier_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
  success BOOLEAN;
BEGIN
  payload := jsonb_build_object(
    'event', 'courrier_created',
    'courrier_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'type_courrier', NEW.type_courrier,
    'statut', NEW.statut,
    'date_creation', NEW.date_creation
  );

  SELECT public.notify_webhook_by_event('courrier_created', payload, 2) INTO success;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'event', 'document_uploaded',
    'document_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'nom_fichier', NEW.nom_fichier,
    'type_document', NEW.type_document,
    'created_at', NEW.created_at
  );

  BEGIN
    PERFORM public.notify_webhook_by_event('document_uploaded', payload, 1);
  EXCEPTION
    WHEN OTHERS THEN
      INSERT INTO public.webhook_logs (webhook_url, payload, status, error_message)
      VALUES ('config:webhook_endpoints', payload, 'error', 'Trigger exception: ' || SQLERRM);
  END;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_courrier_validated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
  success BOOLEAN;
BEGIN
  IF OLD.statut != NEW.statut AND NEW.statut IN ('valide_pret_envoi', 'modifie_pret_envoi') THEN
    payload := jsonb_build_object(
      'event', 'courrier_validated',
      'courrier_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_courrier', NEW.type_courrier,
      'statut', NEW.statut,
      'admin_validateur', NEW.admin_validateur,
      'date_validation', NEW.date_validation
    );

    SELECT public.notify_webhook_by_event('courrier_validated', payload, 2) INTO success;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_courrier_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
  success BOOLEAN;
BEGIN
  IF OLD.statut != NEW.statut AND NEW.statut = 'envoye' THEN
    payload := jsonb_build_object(
      'event', 'courrier_sent',
      'courrier_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_courrier', NEW.type_courrier,
      'numero_suivi', NEW.numero_suivi,
      'reference_laposte', NEW.reference_laposte,
      'cout_envoi', NEW.cout_envoi,
      'date_envoi', NEW.date_envoi
    );

    SELECT public.notify_webhook_by_event('courrier_sent', payload, 2) INTO success;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_echeance_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
  success BOOLEAN;
BEGIN
  payload := jsonb_build_object(
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

  SELECT public.notify_webhook_by_event('echeance_created', payload, 2) INTO success;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_echeance_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
  success BOOLEAN;
BEGIN
  IF NEW.statut = 'actif' AND NEW.date_alerte <= CURRENT_DATE AND OLD.notifie = FALSE AND NEW.notifie = TRUE THEN
    payload := jsonb_build_object(
      'event', 'echeance_alert',
      'echeance_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_echeance', NEW.type_echeance,
      'date_limite', NEW.date_limite,
      'date_alerte', NEW.date_alerte,
      'description', NEW.description,
      'jours_restants', (NEW.date_limite - CURRENT_DATE)
    );

    SELECT public.notify_webhook_by_event('echeance_alert', payload, 2) INTO success;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_echeance_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
  success BOOLEAN;
BEGIN
  IF OLD.statut != NEW.statut THEN
    payload := jsonb_build_object(
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

    SELECT public.notify_webhook_by_event('echeance_status_changed', payload, 2) INTO success;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers to actually fire these notifications
DROP TRIGGER IF EXISTS trg_courriers_created ON public.courriers_projets;
CREATE TRIGGER trg_courriers_created
AFTER INSERT ON public.courriers_projets
FOR EACH ROW
EXECUTE FUNCTION public.notify_courrier_created();

DROP TRIGGER IF EXISTS trg_courriers_validated ON public.courriers_projets;
CREATE TRIGGER trg_courriers_validated
AFTER UPDATE ON public.courriers_projets
FOR EACH ROW
EXECUTE FUNCTION public.notify_courrier_validated();

DROP TRIGGER IF EXISTS trg_courriers_sent ON public.courriers_projets;
CREATE TRIGGER trg_courriers_sent
AFTER UPDATE ON public.courriers_projets
FOR EACH ROW
EXECUTE FUNCTION public.notify_courrier_sent();

DROP TRIGGER IF EXISTS trg_echeances_created ON public.echeances;
CREATE TRIGGER trg_echeances_created
AFTER INSERT ON public.echeances
FOR EACH ROW
EXECUTE FUNCTION public.notify_echeance_created();

DROP TRIGGER IF EXISTS trg_echeances_alert ON public.echeances;
CREATE TRIGGER trg_echeances_alert
AFTER UPDATE ON public.echeances
FOR EACH ROW
EXECUTE FUNCTION public.notify_echeance_alert();

DROP TRIGGER IF EXISTS trg_echeances_status_change ON public.echeances;
CREATE TRIGGER trg_echeances_status_change
AFTER UPDATE ON public.echeances
FOR EACH ROW
EXECUTE FUNCTION public.notify_echeance_status_change();

DROP TRIGGER IF EXISTS trg_document_uploaded ON public.documents;
CREATE TRIGGER trg_document_uploaded
AFTER INSERT ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_document_upload();