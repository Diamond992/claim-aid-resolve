-- Create dynamic reference tables for admin control
CREATE TABLE public.types_sinistres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  ordre_affichage INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.types_courriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  ordre_affichage INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sinistre_courrier_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_sinistre_id UUID NOT NULL REFERENCES public.types_sinistres(id) ON DELETE CASCADE,
  type_courrier_id UUID NOT NULL REFERENCES public.types_courriers(id) ON DELETE CASCADE,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(type_sinistre_id, type_courrier_id)
);

-- Enable RLS
ALTER TABLE public.types_sinistres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.types_courriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinistre_courrier_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies for types_sinistres
CREATE POLICY "Admins can manage types_sinistres" ON public.types_sinistres
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active types_sinistres" ON public.types_sinistres
  FOR SELECT USING (actif = true);

-- RLS Policies for types_courriers  
CREATE POLICY "Admins can manage types_courriers" ON public.types_courriers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active types_courriers" ON public.types_courriers
  FOR SELECT USING (actif = true);

-- RLS Policies for sinistre_courrier_mapping
CREATE POLICY "Admins can manage sinistre_courrier_mapping" ON public.sinistre_courrier_mapping
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active mappings" ON public.sinistre_courrier_mapping
  FOR SELECT USING (actif = true);

-- Insert existing enum values
INSERT INTO public.types_sinistres (code, libelle, ordre_affichage) VALUES
  ('auto', 'Automobile', 1),
  ('habitation', 'Habitation', 2),
  ('sante', 'Santé', 3),
  ('autre', 'Autre', 4);

INSERT INTO public.types_courriers (code, libelle, ordre_affichage) VALUES
  ('reclamation_interne', 'Réclamation Interne', 1),
  ('mediation', 'Médiation', 2),
  ('mise_en_demeure', 'Mise en Demeure', 3);

-- Create all possible mappings (initially all active)
INSERT INTO public.sinistre_courrier_mapping (type_sinistre_id, type_courrier_id)
SELECT ts.id, tc.id 
FROM public.types_sinistres ts 
CROSS JOIN public.types_courriers tc;

-- Add triggers for updated_at
CREATE TRIGGER update_types_sinistres_updated_at
  BEFORE UPDATE ON public.types_sinistres
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_types_courriers_updated_at
  BEFORE UPDATE ON public.types_courriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sinistre_courrier_mapping_updated_at
  BEFORE UPDATE ON public.sinistre_courrier_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();