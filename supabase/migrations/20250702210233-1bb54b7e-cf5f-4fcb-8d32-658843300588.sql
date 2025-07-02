
-- Create enum types for type_sinistre and statut
CREATE TYPE public.type_sinistre AS ENUM ('auto', 'habitation', 'sante', 'autre');
CREATE TYPE public.statut_dossier AS ENUM ('nouveau', 'en_cours', 'reclamation_envoyee', 'mediation', 'clos');

-- Create the dossiers table
CREATE TABLE public.dossiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  police_number VARCHAR(255) NOT NULL,
  compagnie_assurance VARCHAR(255) NOT NULL,
  type_sinistre type_sinistre NOT NULL,
  date_sinistre DATE NOT NULL,
  montant_refuse DECIMAL(10,2) NOT NULL,
  motif_refus TEXT,
  refus_date DATE NOT NULL,
  statut statut_dossier NOT NULL DEFAULT 'nouveau',
  adresse_assureur JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Clients can view their own dossiers
CREATE POLICY "Clients can view their own dossiers" 
  ON public.dossiers 
  FOR SELECT 
  USING (auth.uid() = client_id);

-- Clients can create their own dossiers
CREATE POLICY "Clients can create their own dossiers" 
  ON public.dossiers 
  FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

-- Clients can update their own dossiers
CREATE POLICY "Clients can update their own dossiers" 
  ON public.dossiers 
  FOR UPDATE 
  USING (auth.uid() = client_id);

-- Clients can delete their own dossiers
CREATE POLICY "Clients can delete their own dossiers" 
  ON public.dossiers 
  FOR DELETE 
  USING (auth.uid() = client_id);

-- Admins can view all dossiers
CREATE POLICY "Admins can view all dossiers" 
  ON public.dossiers 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update all dossiers
CREATE POLICY "Admins can update all dossiers" 
  ON public.dossiers 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dossiers_updated_at 
  BEFORE UPDATE ON public.dossiers 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
