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
    
    // Vérifier l'en-tête d'autorisation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('En-tête d\'autorisation manquant');
    }
    
    console.log('Authorization header present:', !!authHeader);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log('Fetching dossier data for ID:', dossierId);

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
      .maybeSingle();

    console.log('Dossier query result:', { data: !!dossierData, error: dossierError });

    if (dossierError) {
      console.error('Dossier fetch error:', dossierError);
      throw dossierError;
    }

    if (!dossierData) {
      console.error('Dossier not found for ID:', dossierId);
      throw new Error(`Dossier non trouvé pour l'ID: ${dossierId}`);
    }

    // Vérifier que les données du profil existent
    if (!dossierData.profiles) {
      console.error('Profile data missing for dossier:', dossierId);
      throw new Error('Données du profil client manquantes');
    }

    console.log('Profile data found:', { 
      firstName: !!dossierData.profiles.first_name, 
      lastName: !!dossierData.profiles.last_name,
      email: !!dossierData.profiles.email 
    });

    // Préparer le contexte pour l'IA
    const context = {
      client: `${dossierData.profiles.first_name || 'N/A'} ${dossierData.profiles.last_name || 'N/A'}`,
      email: dossierData.profiles.email || 'N/A',
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

    // Vérifier la clé Groq
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('GROQ_API_KEY is not configured');
      throw new Error('Configuration manquante: clé Groq non configurée');
    }

    console.log('Calling Groq API with model: llama3-8b-8192');

    // Appeler l'API Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1024
      }),
    });

    console.log('Groq API response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error details:', errorText);
      
      if (groqResponse.status === 429) {
        throw new Error('Limite de taux Groq atteinte. Veuillez réessayer dans quelques minutes.');
      } else if (groqResponse.status === 401) {
        throw new Error('Clé API Groq invalide ou manquante.');
      } else {
        throw new Error(`Erreur Groq API (${groqResponse.status}): ${errorText}`);
      }
    }

    const groqData = await groqResponse.json();
    console.log('Groq API response:', JSON.stringify(groqData, null, 2));
    
    // Extraire le contenu généré de la réponse Groq (format OpenAI)
    const generatedContent = groqData.choices?.[0]?.message?.content;

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