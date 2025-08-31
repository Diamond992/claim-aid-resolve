import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dossierId, typeCourrier, tone = 'ferme', length = 'moyen' } = await req.json();
    
    console.log('Generate AI courrier request:', { dossierId, typeCourrier, tone, length });
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Récupérer les données du dossier et documents
    const { data: dossierData, error: dossierError } = await supabaseClient
      .from('dossiers')
      .select(`
        *,
        profiles:client_id (
          first_name,
          last_name,
          email
        ),
        documents (
          nom_fichier,
          type_document,
          url_stockage
        )
      `)
      .eq('id', dossierId)
      .single();

    if (dossierError) throw dossierError;

    // Préparer le contexte pour l'IA
    const context = {
      client: `${dossierData.profiles.first_name} ${dossierData.profiles.last_name}`,
      email: dossierData.profiles.email,
      typeSinistre: dossierData.type_sinistre,
      dateSinistre: dossierData.date_sinistre,
      montantRefuse: dossierData.montant_refuse,
      refusDate: dossierData.refus_date,
      policeNumber: dossierData.police_number,
      compagnieAssurance: dossierData.compagnie_assurance,
      motifRefus: dossierData.motif_refus,
      documents: dossierData.documents?.map(doc => ({ 
        nom: doc.nom_fichier, 
        type: doc.type_document 
      })) || [],
      adresseAssureur: dossierData.adresse_assureur
    };

    // Définir les types de courriers et leurs objectifs
    const courrierObjectives = {
      'reclamation_interne': 'Rédiger une réclamation interne ferme mais respectueuse pour contester le refus de prise en charge',
      'mediation': 'Rédiger une demande de médiation professionnelle et structurée',
      'mise_en_demeure': 'Rédiger une mise en demeure juridique formelle et précise'
    };

    // Construire le prompt pour l'IA
    const systemPrompt = `Vous êtes un expert juridique spécialisé dans les assurances. Votre mission est de rédiger des courriers professionnels pour contester des refus d'assurance.

OBJECTIF: ${courrierObjectives[typeCourrier] || 'Rédiger un courrier professionnel'}

PARAMÈTRES:
- Ton: ${tone === 'ferme' ? 'Ferme mais respectueux, assertif' : 'Diplomatique et courtois'}
- Longueur: ${length === 'court' ? 'Concis (300-500 mots)' : length === 'long' ? 'Détaillé (800-1200 mots)' : 'Moyen (500-800 mots)'}

STRUCTURE REQUISE:
1. En-tête avec coordonnées
2. Objet clair
3. Références du dossier
4. Contexte factuel
5. Arguments juridiques pertinents
6. Demande précise
7. Formule de politesse

RÈGLES:
- Utilisez un français juridique précis
- Citez les articles de loi pertinents quand approprié
- Restez factuel et argumenté
- Évitez l'émotionnel
- Structurez clairement vos arguments`;

    const userPrompt = `Contexte du dossier:
- Client: ${context.client}
- Email: ${context.email}
- Type de sinistre: ${context.typeSinistre}
- Date du sinistre: ${context.dateSinistre}
- Montant refusé: ${context.montantRefuse} €
- Date de refus: ${context.refusDate}
- Numéro de police: ${context.policeNumber}
- Compagnie d'assurance: ${context.compagnieAssurance}
- Motif de refus: ${context.motifRefus || 'Non spécifié'}
- Documents fournis: ${context.documents.map(d => d.nom).join(', ') || 'Aucun'}
${context.adresseAssureur ? `- Adresse assureur: ${JSON.stringify(context.adresseAssureur)}` : ''}

Rédigez le courrier complet en tenant compte de tous ces éléments.`;

    // Vérifier la clé Mistral
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralApiKey) {
      console.error('MISTRAL_API_KEY is not configured');
      throw new Error('Configuration manquante: clé Mistral non configurée');
    }

    console.log('Calling Mistral API with model: open-mistral-7b');

    // Appeler l'API Mistral
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'open-mistral-7b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.3
      }),
    });

    console.log('Mistral API response status:', mistralResponse.status);

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error('Mistral API error details:', errorText);
      
      if (mistralResponse.status === 429) {
        throw new Error('Limite de taux Mistral atteinte. Veuillez réessayer dans quelques minutes.');
      } else if (mistralResponse.status === 401) {
        throw new Error('Clé API Mistral invalide ou manquante.');
      } else {
        throw new Error(`Erreur Mistral API (${mistralResponse.status}): ${errorText}`);
      }
    }

    const mistralData = await mistralResponse.json();
    const generatedContent = mistralData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      success: true,
      contenu_genere: generatedContent,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-courrier function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});