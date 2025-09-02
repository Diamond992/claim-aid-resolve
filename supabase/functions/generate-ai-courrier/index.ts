import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";

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

    // Prompts optimisés pour API gratuites (plus courts)
    const systemPrompt = `Expert juridique assurances. Rédigez ${courrierObjectives[typeCourrier]}.

Ton: ${tone === 'ferme' ? 'Ferme, assertif' : 'Diplomatique'}
Longueur: ${length === 'court' ? '300-400 mots' : length === 'long' ? '600-800 mots' : '400-600 mots'}

Structure: En-tête, Objet, Références, Contexte, Arguments juridiques, Demande, Politesse.
Style: Français juridique précis, factuel, structuré.`;

    const userPrompt = `Dossier:
Client: ${context.client} (${context.email})
Sinistre: ${context.typeSinistre} du ${context.dateSinistre}
Montant: ${context.montantRefuse}€, refusé le ${context.refusDate}
Police: ${context.policeNumber}, Assureur: ${context.compagnieAssurance}
Motif refus: ${context.motifRefus || 'Non spécifié'}
Documents: ${context.documents.map(d => d.nom).join(', ') || 'Aucun'}

Rédigez le courrier complet.`;

    // === DIAGNOSTIC VARIABLES D'ENVIRONNEMENT ===
    console.log('🔍 Variables d\'environnement disponibles:', Object.keys(Deno.env.toObject()));
    console.log('🔍 Variables Supabase:', {
      'SUPABASE_URL': !!Deno.env.get('SUPABASE_URL'),
      'SUPABASE_ANON_KEY': !!Deno.env.get('SUPABASE_ANON_KEY'),
      'SUPABASE_SERVICE_ROLE_KEY': !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    });
    
    // === CONFIG AI AVEC MISTRAL EN PRIORITÉ ===
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log(`🔧 Configuration IA:`, {
      'Mistral': !!mistralApiKey,
      'Groq': !!groqApiKey,
      'OpenAI': !!openaiApiKey
    });
    
    if (!mistralApiKey && !groqApiKey && !openaiApiKey) {
      console.error('❌ Aucune clé IA configurée');
      throw new Error('Configuration manquante: aucune clé IA configurée');
    }

    // Initialiser les clients IA
    const groq = groqApiKey ? new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    }) : null;

    const openai = openaiApiKey ? new OpenAI({
      apiKey: openaiApiKey,
    }) : null;

    // Modèles optimisés pour API gratuites (ordre de priorité)
    const groqModels = [
      "llama3-8b-8192",        // Plus rapide, moins de ressources
      "mixtral-8x7b-32768",    // Bon compromis qualité/vitesse
      "llama3-70b-8192",       // Plus lourd, en dernier recours
    ];

    // === FONCTION DE TEST AVEC MISTRAL EN PRIORITÉ ===
    async function testAIModels() {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // === PRIORITÉ 1: MISTRAL AI (API gratuite généreuse) ===
      if (mistralApiKey) {
        try {
          console.log('🚀 Test Mistral AI...');
          
          const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mistralApiKey}`,
            },
            body: JSON.stringify({
              model: 'mistral-tiny', // Modèle gratuit le plus stable
              messages,
              max_tokens: length === 'court' ? 512 : length === 'long' ? 1024 : 768,
            }),
          });

          if (!mistralResponse.ok) {
            const errorData = await mistralResponse.text();
            console.error(`❌ Mistral API error ${mistralResponse.status}:`, errorData);
            throw new Error(`Mistral API error: ${mistralResponse.status}`);
          }

          const mistralData = await mistralResponse.json();
          const generatedContent = mistralData.choices[0].message.content;
          
          if (generatedContent && generatedContent.trim()) {
            console.log('✅ Succès avec Mistral AI');
            return generatedContent;
          }
        } catch (mistralError) {
          console.error('💥 Erreur Mistral:', mistralError.message);
        }
      }

      // === PRIORITÉ 2: GROQ ===
      if (groq) {
        for (let modelIndex = 0; modelIndex < groqModels.length; modelIndex++) {
          const model = groqModels[modelIndex];
          
          // Retry avec délais croissants pour API gratuite
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`🔎 Test Groq ${model} (tentative ${attempt}/3)`);

              const response = await groq.chat.completions.create({
                model,
                messages,
                max_completion_tokens: length === 'court' ? 512 : length === 'long' ? 1024 : 768,
                temperature: 0.7,
              });

              console.log(`✅ Succès avec Groq ${model} après ${attempt} tentative(s)`);
              return response.choices[0].message.content;

            } catch (err) {
              const errorMsg = err.response?.data?.error?.message || err.message;
              console.error(`❌ Groq ${model} tentative ${attempt}:`, errorMsg);
              
              // Si rate limit ou quota, attendre plus longtemps
              if (errorMsg.includes('rate_limit') || errorMsg.includes('quota')) {
                const delay = attempt * 2000; // 2s, 4s, 6s
                console.log(`⏳ Rate limit détecté, attente ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else if (attempt === 3) {
                // Dernière tentative échouée, passer au modèle suivant
                break;
              }
            }
          }
        }
      }

      // === PRIORITÉ 3: OPENAI (FALLBACK) ===
      if (openai) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`⚠️ Fallback OpenAI (tentative ${attempt}/2)...`);
            const openaiResp = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages,
              max_tokens: length === 'court' ? 512 : length === 'long' ? 1024 : 768,
              temperature: 0.7,
            });
            console.log("✅ Succès avec OpenAI (fallback)");
            return openaiResp.choices[0].message.content;

          } catch (openaiErr) {
            const errorMsg = openaiErr.response?.data?.error?.message || openaiErr.message;
            console.error(`💥 OpenAI tentative ${attempt}:`, errorMsg);
            
            if (attempt === 1 && (errorMsg.includes('rate_limit') || errorMsg.includes('quota'))) {
              console.log("⏳ Attente 3s avant retry OpenAI...");
              await new Promise(resolve => setTimeout(resolve, 3000));
            } else if (attempt === 2) {
              throw new Error(`Échec final: ${errorMsg}`);
            }
          }
        }
      }

      throw new Error("Aucun service IA disponible. Vérifiez vos quotas API ou souscrivez un plan payant.");
    }

    // === TEST DE CONNECTIVITÉ RÉSEAU ===
    try {
      console.log('🌐 Test de connectivité réseau...');
      const testResponse = await fetch('https://httpbin.org/get', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      console.log('✅ Connectivité réseau OK:', testResponse.status);
    } catch (networkError) {
      console.error('⚠️ Problème de connectivité:', networkError.message);
    }

    // Générer le contenu avec le système de fallback automatique
    const generatedContent = await testAIModels();

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