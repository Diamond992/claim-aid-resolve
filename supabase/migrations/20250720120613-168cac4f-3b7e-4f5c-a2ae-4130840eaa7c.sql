
-- Remove the test dossier "reclamation assurance santé" from the database
-- This will clean up the mock case from the admin dashboard
DELETE FROM public.dossiers 
WHERE id = '9f3878fc-ff69-444b-8713-d512cb419687'
AND compagnie_assurance = 'Mutuelle de la Santé'
AND client_id = (
  SELECT id FROM public.profiles 
  WHERE email = 'lnnbl@gmail.com' 
  AND first_name = 'ln' 
  AND last_name = 'nbl'
);

-- Also remove any related data that might reference this dossier
DELETE FROM public.courriers_projets WHERE dossier_id = '9f3878fc-ff69-444b-8713-d512cb419687';
DELETE FROM public.echeances WHERE dossier_id = '9f3878fc-ff69-444b-8713-d512cb419687';
DELETE FROM public.documents WHERE dossier_id = '9f3878fc-ff69-444b-8713-d512cb419687';
DELETE FROM public.paiements WHERE dossier_id = '9f3878fc-ff69-444b-8713-d512cb419687';
