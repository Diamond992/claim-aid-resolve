
-- Créer la table webhook_logs pour tracer toutes les tentatives de webhook
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL, -- 'success', 'error', 'timeout'
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les requêtes sur les logs
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);

-- Fonction centralisée pour envoyer des webhooks à Make.com
CREATE OR REPLACE FUNCTION public.notify_make_webhook(
  webhook_url TEXT,
  payload_json JSONB,
  max_retries INTEGER DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_record RECORD;
  attempt INTEGER := 1;
  success BOOLEAN := FALSE;
  error_msg TEXT;
BEGIN
  -- Vérifier que l'URL est fournie
  IF webhook_url IS NULL OR webhook_url = '' THEN
    INSERT INTO public.webhook_logs (webhook_url, payload, status, error_message)
    VALUES (COALESCE(webhook_url, 'NULL'), payload_json, 'error', 'Webhook URL is null or empty');
    RETURN FALSE;
  END IF;

  -- Boucle pour les tentatives avec retry
  WHILE attempt <= max_retries AND NOT success LOOP
    BEGIN
      -- Tentative d'envoi du webhook
      SELECT * INTO response_record FROM net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload_json,
        timeout_milliseconds := 10000
      );

      -- Vérifier le statut de la réponse
      IF response_record.status_code BETWEEN 200 AND 299 THEN
        success := TRUE;
        
        -- Logger le succès
        INSERT INTO public.webhook_logs (
          webhook_url, 
          payload, 
          status, 
          response_body, 
          attempt_number
        )
        VALUES (
          webhook_url, 
          payload_json, 
          'success', 
          response_record.content::TEXT, 
          attempt
        );
        
        RAISE NOTICE 'Webhook sent successfully to % on attempt %', webhook_url, attempt;
      ELSE
        error_msg := format('HTTP %s: %s', response_record.status_code, response_record.content);
        
        -- Logger l'erreur HTTP
        INSERT INTO public.webhook_logs (
          webhook_url, 
          payload, 
          status, 
          error_message, 
          response_body, 
          attempt_number
        )
        VALUES (
          webhook_url, 
          payload_json, 
          'error', 
          error_msg, 
          response_record.content::TEXT, 
          attempt
        );
        
        RAISE WARNING 'Webhook failed with HTTP %s on attempt % to %: %', 
          response_record.status_code, attempt, webhook_url, response_record.content;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        error_msg := SQLERRM;
        
        -- Logger l'exception
        INSERT INTO public.webhook_logs (
          webhook_url, 
          payload, 
          status, 
          error_message, 
          attempt_number
        )
        VALUES (
          webhook_url, 
          payload_json, 
          'error', 
          error_msg, 
          attempt
        );
        
        RAISE WARNING 'Webhook exception on attempt % to %: %', attempt, webhook_url, error_msg;
    END;
    
    attempt := attempt + 1;
    
    -- Attendre avant la prochaine tentative (sauf si c'est la dernière)
    IF attempt <= max_retries AND NOT success THEN
      PERFORM pg_sleep(attempt * 2); -- Backoff exponentiel
    END IF;
  END LOOP;

  RETURN success;
END;
$$;

-- Mettre à jour la fonction notify_document_upload pour utiliser la nouvelle fonction centralisée
CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
  success BOOLEAN;
BEGIN
  -- Préparer le payload
  payload := jsonb_build_object(
    'event', 'document_uploaded',
    'document_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'nom_fichier', NEW.nom_fichier,
    'type_document', NEW.type_document,
    'taille_fichier', NEW.taille_fichier,
    'mime_type', NEW.mime_type,
    'uploaded_by', NEW.uploaded_by,
    'created_at', NEW.created_at
  );

  -- Utiliser la fonction centralisée
  SELECT public.notify_make_webhook(webhook_url, payload) INTO success;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction notify_courrier_created pour utiliser la nouvelle fonction centralisée
CREATE OR REPLACE FUNCTION public.notify_courrier_created()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
  success BOOLEAN;
BEGIN
  -- Préparer le payload
  payload := jsonb_build_object(
    'event', 'courrier_created',
    'courrier_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'type_courrier', NEW.type_courrier,
    'statut', NEW.statut,
    'date_creation', NEW.date_creation
  );

  -- Utiliser la fonction centralisée
  SELECT public.notify_make_webhook(webhook_url, payload) INTO success;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction notify_courrier_validated pour utiliser la nouvelle fonction centralisée
CREATE OR REPLACE FUNCTION public.notify_courrier_validated()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
  success BOOLEAN;
BEGIN
  -- Vérifier si le statut a changé vers 'valide_pret_envoi' ou 'modifie_pret_envoi'
  IF OLD.statut != NEW.statut AND NEW.statut IN ('valide_pret_envoi', 'modifie_pret_envoi') THEN
    -- Préparer le payload
    payload := jsonb_build_object(
      'event', 'courrier_validated',
      'courrier_id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_courrier', NEW.type_courrier,
      'statut', NEW.statut,
      'admin_validateur', NEW.admin_validateur,
      'date_validation', NEW.date_validation
    );

    -- Utiliser la fonction centralisée
    SELECT public.notify_make_webhook(webhook_url, payload) INTO success;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction notify_courrier_sent pour utiliser la nouvelle fonction centralisée
CREATE OR REPLACE FUNCTION public.notify_courrier_sent()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
  success BOOLEAN;
BEGIN
  -- Vérifier si le statut a changé vers 'envoye'
  IF OLD.statut != NEW.statut AND NEW.statut = 'envoye' THEN
    -- Préparer le payload
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

    -- Utiliser la fonction centralisée
    SELECT public.notify_make_webhook(webhook_url, payload) INTO success;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction notify_echeance_created pour utiliser la nouvelle fonction centralisée
CREATE OR REPLACE FUNCTION public.notify_echeance_created()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
  success BOOLEAN;
BEGIN
  -- Préparer le payload
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

  -- Utiliser la fonction centralisée
  SELECT public.notify_make_webhook(webhook_url, payload) INTO success;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction notify_echeance_alert pour utiliser la nouvelle fonction centralisée
CREATE OR REPLACE FUNCTION public.notify_echeance_alert()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
  success BOOLEAN;
BEGIN
  -- Vérifier si on approche de la date d'alerte et que ce n'est pas encore notifié
  IF NEW.statut = 'actif' AND NEW.date_alerte <= CURRENT_DATE AND OLD.notifie = FALSE AND NEW.notifie = TRUE THEN
    -- Préparer le payload
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

    -- Utiliser la fonction centralisée
    SELECT public.notify_make_webhook(webhook_url, payload) INTO success;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction notify_echeance_status_change pour utiliser la nouvelle fonction centralisée
CREATE OR REPLACE FUNCTION public.notify_echeance_status_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
  success BOOLEAN;
BEGIN
  -- Vérifier si le statut a changé
  IF OLD.statut != NEW.statut THEN
    -- Préparer le payload
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

    -- Utiliser la fonction centralisée
    SELECT public.notify_make_webhook(webhook_url, payload) INTO success;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer RLS sur la table webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour que seuls les admins puissent voir les logs de webhook
CREATE POLICY "Admins can view webhook logs" 
  ON public.webhook_logs 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

-- Index sur webhook_logs.webhook_url pour les requêtes par URL
CREATE INDEX idx_webhook_logs_webhook_url ON public.webhook_logs(webhook_url);
