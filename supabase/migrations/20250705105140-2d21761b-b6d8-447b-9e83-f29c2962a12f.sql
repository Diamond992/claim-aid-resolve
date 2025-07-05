
-- Créer l'enum pour les types de configuration
CREATE TYPE public.config_type AS ENUM ('string', 'number', 'boolean', 'json');

-- Créer la table configuration
CREATE TABLE public.configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cle VARCHAR(255) NOT NULL UNIQUE,
  valeur TEXT NOT NULL,
  type config_type NOT NULL,
  description TEXT,
  modifiable BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS sur la table
ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les admins (peuvent tout voir et modifier)
CREATE POLICY "Admins can view all configurations" 
  ON public.configuration 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert configurations" 
  ON public.configuration 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all configurations" 
  ON public.configuration 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all configurations" 
  ON public.configuration 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_configuration_updated_at 
  BEFORE UPDATE ON public.configuration 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_configuration_cle ON public.configuration(cle);
CREATE INDEX idx_configuration_type ON public.configuration(type);
CREATE INDEX idx_configuration_modifiable ON public.configuration(modifiable);

-- Pré-remplir avec les paramètres système
INSERT INTO public.configuration (cle, valeur, type, description, modifiable) VALUES
('delai_reponse_assureur', '60', 'number', 'Délai de réponse de l''assureur en jours', true),
('delai_prescription', '2', 'number', 'Délai de prescription en années', true),
('cout_lrar', '5.00', 'number', 'Coût d''envoi en lettre recommandée avec accusé de réception en euros', true);
