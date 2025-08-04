-- Sécuriser les fonctions de chiffrement restantes
ALTER FUNCTION public.encrypt_sensitive_data(text) SET search_path TO 'public';
ALTER FUNCTION public.decrypt_sensitive_data(text) SET search_path TO 'public';

-- Sécuriser les fonctions de notification restantes
ALTER FUNCTION public.notify_document_upload() SET search_path TO 'public';
ALTER FUNCTION public.notify_courrier_created() SET search_path TO 'public';
ALTER FUNCTION public.notify_courrier_validated() SET search_path TO 'public';
ALTER FUNCTION public.notify_courrier_sent() SET search_path TO 'public';
ALTER FUNCTION public.notify_echeance_created() SET search_path TO 'public';
ALTER FUNCTION public.notify_echeance_alert() SET search_path TO 'public';
ALTER FUNCTION public.notify_echeance_status_change() SET search_path TO 'public';
ALTER FUNCTION public.notify_make_webhook(text, jsonb, integer) SET search_path TO 'public';