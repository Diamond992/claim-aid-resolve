
-- Créer la table modeles_courriers
CREATE TABLE public.modeles_courriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_modele VARCHAR(255) NOT NULL,
  type_sinistre type_sinistre NOT NULL,
  type_courrier type_courrier NOT NULL,
  template_content TEXT NOT NULL,
  variables_requises JSONB NOT NULL DEFAULT '[]'::jsonb,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS sur la table
ALTER TABLE public.modeles_courriers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les admins (peuvent tout voir et modifier)
CREATE POLICY "Admins can view all templates" 
  ON public.modeles_courriers 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert templates" 
  ON public.modeles_courriers 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all templates" 
  ON public.modeles_courriers 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all templates" 
  ON public.modeles_courriers 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_modeles_courriers_updated_at 
  BEFORE UPDATE ON public.modeles_courriers 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_modeles_courriers_type_sinistre ON public.modeles_courriers(type_sinistre);
CREATE INDEX idx_modeles_courriers_type_courrier ON public.modeles_courriers(type_courrier);
CREATE INDEX idx_modeles_courriers_actif ON public.modeles_courriers(actif);

-- Pré-remplir avec des modèles pour auto, habitation et santé
INSERT INTO public.modeles_courriers (nom_modele, type_sinistre, type_courrier, template_content, variables_requises) VALUES

-- Modèles pour AUTO - Réclamation interne
('Réclamation Auto - Refus de prise en charge', 'auto', 'reclamation_interne', 
'Madame, Monsieur,

Par la présente, je conteste formellement votre décision de refus de prise en charge concernant le sinistre automobile survenu le {{date_sinistre}}.

Références du dossier :
- Police d''assurance : {{police_number}}
- Sinistre du : {{date_sinistre}}
- Montant refusé : {{montant_refuse}} €
- Motif de refus invoqué : {{motif_refus}}

Les circonstances de l''accident :
{{description_accident}}

Je conteste ce refus pour les motifs suivants :
{{motifs_contestation}}

Conformément aux dispositions de votre contrat et du Code des assurances, je vous demande de reconsidérer votre position et de procéder à l''indemnisation du sinistre.

Dans l''attente de votre réponse sous 15 jours, je vous prie d''agréer mes salutations distinguées.

{{nom_client}}
{{adresse_client}}', 
'["date_sinistre", "police_number", "montant_refuse", "motif_refus", "description_accident", "motifs_contestation", "nom_client", "adresse_client"]'),

-- Modèles pour HABITATION - Réclamation interne
('Réclamation Habitation - Dégât des eaux', 'habitation', 'reclamation_interne',
'Madame, Monsieur,

Suite à votre courrier de refus en date du {{date_refus}}, je souhaite contester votre décision concernant le sinistre habitation survenu à mon domicile.

Références du sinistre :
- Police d''assurance : {{police_number}}
- Date du sinistre : {{date_sinistre}}
- Nature : Dégât des eaux
- Montant des dommages : {{montant_refuse}} €

Description des faits :
{{description_sinistre}}

Votre refus se base sur {{motif_refus}}, cependant je conteste cette interprétation car :
{{arguments_contestation}}

Pièces jointes à l''appui de ma réclamation :
{{pieces_jointes}}

Je vous demande de bien vouloir réexaminer mon dossier et procéder au règlement des dommages subis.

Cordialement,

{{nom_client}}
{{adresse_client}}',
'["date_refus", "police_number", "date_sinistre", "montant_refuse", "description_sinistre", "motif_refus", "arguments_contestation", "pieces_jointes", "nom_client", "adresse_client"]'),

-- Modèles pour SANTÉ - Réclamation interne
('Réclamation Santé - Remboursement frais médicaux', 'sante', 'reclamation_interne',
'Madame, Monsieur,

Je me permets de vous écrire concernant le refus de remboursement de mes frais médicaux.

Informations du dossier :
- Contrat n° : {{police_number}}
- Période de soins : {{periode_soins}}
- Montant des frais : {{montant_refuse}} €
- Date de votre refus : {{date_refus}}

Nature des soins refusés :
{{nature_soins}}

Motif de refus invoqué : {{motif_refus}}

Je conteste ce refus pour les raisons suivantes :
{{justifications_medicales}}

Ces soins étaient médicalement nécessaires comme l''atteste {{attestation_medecin}}.

Conformément aux garanties souscrites dans mon contrat, ces frais doivent être pris en charge.

Je vous demande de procéder au remboursement dans les meilleurs délais.

Cordialement,

{{nom_client}}
{{adresse_client}}',
'["police_number", "periode_soins", "montant_refuse", "date_refus", "nature_soins", "motif_refus", "justifications_medicales", "attestation_medecin", "nom_client", "adresse_client"]'),

-- Modèles pour MÉDIATION
('Saisine Médiateur - Auto', 'auto', 'mediation',
'Madame, Monsieur le Médiateur,

J''ai l''honneur de saisir votre service de médiation concernant un litige avec {{compagnie_assurance}}.

Objet du litige :
- Contrat d''assurance automobile n° {{police_number}}
- Sinistre du {{date_sinistre}}
- Montant en litige : {{montant_refuse}} €

Historique :
{{historique_reclamation}}

Malgré ma réclamation en date du {{date_reclamation}}, l''assureur maintient sa position de refus.

Points de désaccord :
{{points_desaccord}}

Je sollicite votre intervention pour résoudre ce différend à l''amiable.

Pièces jointes : {{pieces_jointes}}

Dans l''attente de vos conclusions, je vous prie d''agréer mes respectueuses salutations.

{{nom_client}}
{{adresse_client}}',
'["compagnie_assurance", "police_number", "date_sinistre", "montant_refuse", "historique_reclamation", "date_reclamation", "points_desaccord", "pieces_jointes", "nom_client", "adresse_client"]'),

-- Modèles pour MISE EN DEMEURE
('Mise en demeure - Tous sinistres', 'autre', 'mise_en_demeure',
'LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

MISE EN DEMEURE

Madame, Monsieur,

Par la présente, je vous mets en demeure de procéder au règlement du sinistre ci-après désigné :

- Police d''assurance : {{police_number}}
- Date du sinistre : {{date_sinistre}}
- Montant réclamé : {{montant_refuse}} €

Malgré mes précédentes démarches :
{{demarches_anterieures}}

Vous n''avez pas donné suite à mes demandes légitimes.

En conséquence, je vous mets en demeure de :
- Procéder au règlement intégral du sinistre sous 30 jours
- À défaut, engager une procédure judiciaire
- Solliciter le paiement d''intérêts de retard et de dommages-intérêts

Fondements juridiques :
{{fondements_juridiques}}

Cette mise en demeure vaut dernière tentative amiable avant saisine des tribunaux compétents.

{{nom_client}}
{{adresse_client}}

Date : {{date_envoi}}',
'["police_number", "date_sinistre", "montant_refuse", "demarches_anterieures", "fondements_juridiques", "nom_client", "adresse_client", "date_envoi"]');
