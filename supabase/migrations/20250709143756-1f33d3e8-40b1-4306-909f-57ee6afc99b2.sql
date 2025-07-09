
-- Ajouter la contrainte de clé étrangère manquante entre user_roles et profiles
ALTER TABLE public.user_roles
ADD CONSTRAINT fk_user_roles_user_id
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Créer un index pour optimiser les jointures
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
