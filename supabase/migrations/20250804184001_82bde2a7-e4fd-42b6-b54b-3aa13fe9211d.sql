-- Step 1: Temporarily disable the problematic webhook trigger
DROP TRIGGER IF EXISTS trigger_notify_document_upload ON public.documents;

-- Step 2: Fix the notify_make_webhook function with reduced timeout
CREATE OR REPLACE FUNCTION public.notify_make_webhook(webhook_url text, payload_json jsonb, max_retries integer DEFAULT 2)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

  -- Boucle pour les tentatives avec retry réduit
  WHILE attempt <= max_retries AND NOT success LOOP
    BEGIN
      -- Tentative d'envoi du webhook avec timeout réduit
      SELECT * INTO response_record FROM net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload_json,
        timeout_milliseconds := 3000  -- Reduced from 10000 to 3000ms
      );

      -- Vérifier le statut de la réponse
      IF response_record.status_code BETWEEN 200 AND 299 THEN
        success := TRUE;
        
        -- Logger le succès (sans bloquer)
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
          LEFT(response_record.content::TEXT, 500), -- Limit response body length
          attempt
        );
        
      ELSE
        error_msg := format('HTTP %s', response_record.status_code);
        
        -- Logger l'erreur HTTP (limité)
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
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        error_msg := LEFT(SQLERRM, 255); -- Limit error message length
        
        -- Logger l'exception (limité)
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
    END;
    
    attempt := attempt + 1;
    
    -- Pas d'attente entre tentatives pour éviter les timeouts
  END LOOP;

  -- Return success even if webhook fails to not block document insertion
  RETURN TRUE;
END;
$function$;

-- Step 3: Update the document upload trigger to be non-blocking
CREATE OR REPLACE FUNCTION public.notify_document_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  webhook_url TEXT := 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID';
  payload JSONB;
BEGIN
  -- Préparer le payload (simplifié)
  payload := jsonb_build_object(
    'event', 'document_uploaded',
    'document_id', NEW.id,
    'dossier_id', NEW.dossier_id,
    'nom_fichier', NEW.nom_fichier,
    'type_document', NEW.type_document,
    'created_at', NEW.created_at
  );

  -- Tentative webhook non-bloquante (fire and forget)
  BEGIN
    PERFORM public.notify_make_webhook(webhook_url, payload, 1); -- Only 1 attempt
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the trigger
      INSERT INTO public.webhook_logs (webhook_url, payload, status, error_message)
      VALUES (webhook_url, payload, 'error', 'Trigger exception: ' || SQLERRM);
  END;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Reactivate the trigger
CREATE TRIGGER trigger_notify_document_upload
    AFTER INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_document_upload();