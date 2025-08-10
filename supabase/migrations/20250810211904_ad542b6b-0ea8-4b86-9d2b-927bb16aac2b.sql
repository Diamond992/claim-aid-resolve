-- Helper to return a compact profile JSON
CREATE OR REPLACE FUNCTION public.profile_json(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT to_jsonb(p) - 'created_at' - 'updated_at'
  FROM (
    SELECT 
      id,
      first_name,
      last_name,
      email
    FROM public.profiles
    WHERE id = p_user_id
  ) AS p;
$$;

-- Helper to return a dossier JSON with embedded client profile
CREATE OR REPLACE FUNCTION public.dossier_json(p_dossier_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'id', d.id,
    'client_id', d.client_id,
    'type_sinistre', d.type_sinistre,
    'date_sinistre', d.date_sinistre,
    'montant_refuse', d.montant_refuse,
    'refus_date', d.refus_date,
    'police_number', d.police_number,
    'compagnie_assurance', d.compagnie_assurance,
    'statut', d.statut,
    'client', public.profile_json(d.client_id)
  )
  FROM public.dossiers d
  WHERE d.id = p_dossier_id
  LIMIT 1;
$$;

-- Enrich: document upload payload with dossier + uploader profile
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
    'document', jsonb_build_object(
      'id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'nom_fichier', NEW.nom_fichier,
      'type_document', NEW.type_document,
      'mime_type', NEW.mime_type,
      'taille_fichier', NEW.taille_fichier,
      'url_stockage', NEW.url_stockage,
      'uploaded_by', NEW.uploaded_by,
      'uploader', public.profile_json(NEW.uploaded_by),
      'created_at', NEW.created_at
    ),
    'dossier', public.dossier_json(NEW.dossier_id)
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

-- Enrich: courrier created
CREATE OR REPLACE FUNCTION public.notify_courrier_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'event', 'courrier_created',
    'courrier', jsonb_build_object(
      'id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_courrier', NEW.type_courrier,
      'statut', NEW.statut,
      'contenu_genere', NEW.contenu_genere,
      'date_creation', NEW.date_creation
    ),
    'dossier', public.dossier_json(NEW.dossier_id)
  );

  PERFORM public.notify_webhook_by_event('courrier_created', payload, 2);
  RETURN NEW;
END;
$$;

-- Enrich: courrier validated
CREATE OR REPLACE FUNCTION public.notify_courrier_validated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
BEGIN
  IF OLD.statut != NEW.statut AND NEW.statut IN ('valide_pret_envoi', 'modifie_pret_envoi') THEN
    payload := jsonb_build_object(
      'event', 'courrier_validated',
      'courrier', jsonb_build_object(
        'id', NEW.id,
        'dossier_id', NEW.dossier_id,
        'type_courrier', NEW.type_courrier,
        'statut', NEW.statut,
        'date_validation', NEW.date_validation,
        'admin_validateur', NEW.admin_validateur,
        'admin_profile', public.profile_json(NEW.admin_validateur)
      ),
      'dossier', public.dossier_json(NEW.dossier_id)
    );

    PERFORM public.notify_webhook_by_event('courrier_validated', payload, 2);
  END IF;
  RETURN NEW;
END;
$$;

-- Enrich: courrier sent
CREATE OR REPLACE FUNCTION public.notify_courrier_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
BEGIN
  IF OLD.statut != NEW.statut AND NEW.statut = 'envoye' THEN
    payload := jsonb_build_object(
      'event', 'courrier_sent',
      'courrier', jsonb_build_object(
        'id', NEW.id,
        'dossier_id', NEW.dossier_id,
        'type_courrier', NEW.type_courrier,
        'numero_suivi', NEW.numero_suivi,
        'reference_laposte', NEW.reference_laposte,
        'cout_envoi', NEW.cout_envoi,
        'date_envoi', NEW.date_envoi
      ),
      'dossier', public.dossier_json(NEW.dossier_id)
    );

    PERFORM public.notify_webhook_by_event('courrier_sent', payload, 2);
  END IF;
  RETURN NEW;
END;
$$;

-- Enrich: echeance created
CREATE OR REPLACE FUNCTION public.notify_echeance_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'event', 'echeance_created',
    'echeance', jsonb_build_object(
      'id', NEW.id,
      'dossier_id', NEW.dossier_id,
      'type_echeance', NEW.type_echeance,
      'date_limite', NEW.date_limite,
      'date_alerte', NEW.date_alerte,
      'statut', NEW.statut,
      'description', NEW.description,
      'created_at', NEW.created_at
    ),
    'dossier', public.dossier_json(NEW.dossier_id)
  );

  PERFORM public.notify_webhook_by_event('echeance_created', payload, 2);
  RETURN NEW;
END;
$$;

-- Enrich: echeance alert
CREATE OR REPLACE FUNCTION public.notify_echeance_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
BEGIN
  IF NEW.statut = 'actif' AND NEW.date_alerte <= CURRENT_DATE AND OLD.notifie = FALSE AND NEW.notifie = TRUE THEN
    payload := jsonb_build_object(
      'event', 'echeance_alert',
      'echeance', jsonb_build_object(
        'id', NEW.id,
        'dossier_id', NEW.dossier_id,
        'type_echeance', NEW.type_echeance,
        'date_limite', NEW.date_limite,
        'date_alerte', NEW.date_alerte,
        'description', NEW.description
      ),
      'dossier', public.dossier_json(NEW.dossier_id)
    );

    PERFORM public.notify_webhook_by_event('echeance_alert', payload, 2);
  END IF;
  RETURN NEW;
END;
$$;

-- Enrich: echeance status change
CREATE OR REPLACE FUNCTION public.notify_echeance_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload JSONB;
BEGIN
  IF OLD.statut != NEW.statut THEN
    payload := jsonb_build_object(
      'event', 'echeance_status_changed',
      'echeance', jsonb_build_object(
        'id', NEW.id,
        'dossier_id', NEW.dossier_id,
        'type_echeance', NEW.type_echeance,
        'ancien_statut', OLD.statut,
        'nouveau_statut', NEW.statut,
        'date_limite', NEW.date_limite,
        'description', NEW.description,
        'updated_at', NEW.updated_at
      ),
      'dossier', public.dossier_json(NEW.dossier_id)
    );

    PERFORM public.notify_webhook_by_event('echeance_status_changed', payload, 2);
  END IF;
  RETURN NEW;
END;
$$;