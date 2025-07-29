-- Fix all functions to have proper search_path set to 'public'

-- Update existing functions to have SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.generate_admin_invite(admin_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  invite_code text;
BEGIN
  -- Generate a secure random invite code
  invite_code := encode(gen_random_bytes(32), 'base64');
  invite_code := replace(invite_code, '/', '_');
  invite_code := replace(invite_code, '+', '-');
  
  -- Insert the invitation
  INSERT INTO public.admin_invitations (email, invite_code, created_by)
  VALUES (admin_email, invite_code, auth.uid());
  
  RETURN invite_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_admin_action(action_type text, target_user uuid DEFAULT NULL::uuid, action_details jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user, action_details);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_auth_before_insert()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND auth.jwt() IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_dossier_safe(dossier_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN user_id IS NULL THEN false
    ELSE (
      public.get_user_role(user_id) = 'admin'::app_role
      OR 
      public.is_owner(dossier_id, user_id)
    )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_roles.user_id = get_user_role.user_id
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_owner(dossier_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.dossiers
    WHERE dossiers.id = is_owner.dossier_id
      AND dossiers.client_id = is_owner.user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_dossier(dossier_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    public.get_user_role(can_access_dossier.user_id) = 'admin'::app_role
    OR 
    public.is_owner(can_access_dossier.dossier_id, can_access_dossier.user_id);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT public.get_user_role(COALESCE(is_admin.user_id, auth.uid())) = 'admin'::app_role;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN data IS NULL OR data = '' THEN data
    ELSE encode(encrypt(data::bytea, 'encryption_key', 'aes'), 'base64')
  END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN encrypted_data IS NULL OR encrypted_data = '' THEN encrypted_data
    ELSE convert_from(decrypt(decode(encrypted_data, 'base64'), 'encryption_key', 'aes'), 'UTF8')
  END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_make_webhook(webhook_url text, payload_json jsonb, max_retries integer DEFAULT 3)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_document_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_courrier_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_date_alerte()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Calculer date_alerte comme 15 jours avant date_limite
  NEW.date_alerte := NEW.date_limite - INTERVAL '15 days';
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_courrier_validated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_courrier_sent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_echeance_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_echeance_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_echeance_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.assign_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$function$;