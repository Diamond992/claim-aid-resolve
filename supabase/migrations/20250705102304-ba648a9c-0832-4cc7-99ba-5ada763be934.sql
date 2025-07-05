
-- Créer les enums pour les statuts de paiement et types de facturation
CREATE TYPE public.statut_paiement AS ENUM ('pending', 'succeeded', 'failed', 'canceled', 'refunded');
CREATE TYPE public.type_facturation AS ENUM ('forfait_recours', 'abonnement_mensuel');

-- Créer la table paiements
CREATE TABLE public.paiements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR NOT NULL UNIQUE,
  montant DECIMAL(10,2) NOT NULL,
  devise VARCHAR(3) NOT NULL DEFAULT 'EUR',
  statut statut_paiement NOT NULL DEFAULT 'pending',
  type_facturation type_facturation NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS sur la table
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les clients (peuvent voir leurs propres paiements)
CREATE POLICY "Clients can view their own payments" 
  ON public.paiements 
  FOR SELECT 
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own payments" 
  ON public.paiements 
  FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own payments" 
  ON public.paiements 
  FOR UPDATE 
  USING (auth.uid() = client_id);

-- Politiques RLS pour les admins (peuvent tout voir et modifier)
CREATE POLICY "Admins can view all payments" 
  ON public.paiements 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payments" 
  ON public.paiements 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all payments" 
  ON public.paiements 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all payments" 
  ON public.paiements 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_paiements_updated_at 
  BEFORE UPDATE ON public.paiements 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_paiements_client_id ON public.paiements(client_id);
CREATE INDEX idx_paiements_dossier_id ON public.paiements(dossier_id);
CREATE INDEX idx_paiements_stripe_payment_intent_id ON public.paiements(stripe_payment_intent_id);
CREATE INDEX idx_paiements_statut ON public.paiements(statut);
