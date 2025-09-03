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
    const { dossierId, typeCourrier, tone = 'ferme', length = 'moyen', preferredModel = 'auto' } = await req.json();
    
    console.log('Generate AI courrier request:', { dossierId, typeCourrier, tone, length, preferredModel });
    
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

    // === CONFIGURATION DES CLÉS API ===
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    
    console.log('🔧 Configuration IA:', {
      'Mistral': !!mistralApiKey,
      'Groq': !!groqApiKey,  
      'OpenAI': !!openaiApiKey,
      'Claude': !!claudeApiKey
    });
    
    // Vérification avec message d'erreur détaillé
    if (!mistralApiKey && !groqApiKey && !openaiApiKey && !claudeApiKey) {
      const errorMessage = `❌ AUCUNE CLÉ IA CONFIGURÉE
      
Clés recherchées:
- MISTRAL_API_KEY: ${mistralApiKey ? 'TROUVÉ' : 'MANQUANT'}
- GROQ_API_KEY: ${groqApiKey ? 'TROUVÉ' : 'MANQUANT'} 
- OPENAI_API_KEY: ${openaiApiKey ? 'TROUVÉ' : 'MANQUANT'}
- CLAUDE_API_KEY: ${claudeApiKey ? 'TROUVÉ' : 'MANQUANT'}

SOLUTION:
1. Vérifier que les secrets sont définis dans Supabase
2. Redéployer la fonction: supabase functions deploy generate-ai-courrier`;
      
      console.error(errorMessage);
      throw new Error('Configuration manquante: aucune clé IA configurée');
    }

    // Initialiser les clients IA avec gestion d'erreurs
    const groq = groqApiKey ? new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    }) : null;

    const openai = openaiApiKey ? new OpenAI({
      apiKey: openaiApiKey,
    }) : null;

    // === MODÈLES OPTIMISÉS AVEC FALLBACK INTELLIGENT ===
    const modelConfigs = {
      mistral: {
        models: ['mistral-small-latest', 'mistral-tiny'],
        url: 'https://api.mistral.ai/v1/chat/completions',
        headers: { 'Authorization': `Bearer ${mistralApiKey}` }
      },
      groq: {
        models: ['llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama3-8b-8192'],
        client: groq
      },
      openai: {
        models: ['gpt-4o-mini', 'gpt-3.5-turbo'],
        client: openai
      },
      claude: {
        models: ['claude-3-haiku-20240307'],
        url: 'https://api.anthropic.com/v1/messages',
        headers: { 
          'Authorization': `Bearer ${claudeApiKey}`,
          'anthropic-version': '2023-06-01'
        }
      }
    };

    // === FONCTION DE GÉNÉRATION AVEC FALLBACK INTELLIGENT ===
    async function generateWithAI(preferredModel: string = 'auto') {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      console.log(`🚀 Démarrage génération avec modèle préféré: ${preferredModel}`);
      
      // Définir l'ordre de priorité selon la préférence
      const getModelOrder = (preferred: string) => {
        const availableModels = [];
        if (mistralApiKey) availableModels.push('mistral');
        if (groqApiKey) availableModels.push('groq');
        if (openaiApiKey) availableModels.push('openai');
        if (claudeApiKey) availableModels.push('claude');
        
        switch (preferred) {
          case 'mistral':
            return mistralApiKey ? ['mistral', ...availableModels.filter(m => m !== 'mistral')] : availableModels;
          case 'groq':
            return groqApiKey ? ['groq', ...availableModels.filter(m => m !== 'groq')] : availableModels;
          case 'openai':
            return openaiApiKey ? ['openai', ...availableModels.filter(m => m !== 'openai')] : availableModels;
          case 'claude':
            return claudeApiKey ? ['claude', ...availableModels.filter(m => m !== 'claude')] : availableModels;
          default: // 'auto' - ordre optimisé pour la fiabilité
            return ['groq', 'mistral', 'openai', 'claude'].filter(m => availableModels.includes(m));
        }
      };
      
      const modelOrder = getModelOrder(preferredModel);
      console.log(`📋 Ordre des modèles: ${modelOrder.join(' → ')}`);
      
      // Fonction de retry avec backoff exponentiel
      const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 3, baseDelay: number = 1000) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            const errorMsg = error.response?.data?.error?.message || error.message;
            
            if (attempt === maxRetries) {
              throw error;
            }
            
            // Délai plus long pour les erreurs de quota/rate limit
            const isRateLimit = errorMsg.includes('rate_limit') || errorMsg.includes('quota') || errorMsg.includes('429');
            const delay = isRateLimit ? baseDelay * Math.pow(3, attempt) : baseDelay * Math.pow(2, attempt);
            
            console.log(`⏳ Tentative ${attempt}/${maxRetries} échouée, retry dans ${delay}ms: ${errorMsg}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      // Tentative avec chaque modèle dans l'ordre de priorité
      for (const modelType of modelOrder) {
        const config = modelConfigs[modelType];
        if (!config) continue;

        console.log(`🔄 Test du modèle: ${modelType}`);

        try {
          if (modelType === 'mistral') {
            // === MISTRAL AI ===
            for (const model of config.models) {
              try {
                console.log(`🟢 Test Mistral: ${model}`);
                
                const result = await retryWithBackoff(async () => {
                  const response = await fetch(config.url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...config.headers
                    },
                    body: JSON.stringify({
                      model,
                      messages,
                      max_tokens: length === 'court' ? 512 : length === 'long' ? 1024 : 768,
                      temperature: 0.7,
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorData}`);
                  }

                  const data = await response.json();
                  const content = data.choices[0].message.content;
                  
                  if (!content || content.trim().length < 100) {
                    throw new Error('Contenu généré insuffisant');
                  }
                  
                  return content;
                });

                console.log(`✅ Succès avec Mistral ${model}`);
                return result;

              } catch (error) {
                console.error(`❌ Erreur Mistral ${model}:`, error.message);
                continue;
              }
            }

          } else if (modelType === 'groq' && config.client) {
            // === GROQ ===
            for (const model of config.models) {
              try {
                console.log(`⚡ Test Groq: ${model}`);
                
                const result = await retryWithBackoff(async () => {
                  const response = await config.client.chat.completions.create({
                    model,
                    messages,
                    max_completion_tokens: length === 'court' ? 512 : length === 'long' ? 1024 : 768,
                    temperature: 0.7,
                  });

                  const content = response.choices[0].message.content;
                  if (!content || content.trim().length < 100) {
                    throw new Error('Contenu généré insuffisant');
                  }
                  
                  return content;
                });

                console.log(`✅ Succès avec Groq ${model}`);
                return result;

              } catch (error) {
                console.error(`❌ Erreur Groq ${model}:`, error.message);
                continue;
              }
            }

          } else if (modelType === 'openai' && config.client) {
            // === OPENAI ===
            for (const model of config.models) {
              try {
                console.log(`🧠 Test OpenAI: ${model}`);
                
                const result = await retryWithBackoff(async () => {
                  const response = await config.client.chat.completions.create({
                    model,
                    messages,
                    max_tokens: length === 'court' ? 512 : length === 'long' ? 1024 : 768,
                    temperature: 0.7,
                  });

                  const content = response.choices[0].message.content;
                  if (!content || content.trim().length < 100) {
                    throw new Error('Contenu généré insuffisant');
                  }
                  
                  return content;
                });

                console.log(`✅ Succès avec OpenAI ${model}`);
                return result;

              } catch (error) {
                console.error(`❌ Erreur OpenAI ${model}:`, error.message);
                continue;
              }
            }

          } else if (modelType === 'claude') {
            // === CLAUDE ===
            for (const model of config.models) {
              try {
                console.log(`📝 Test Claude: ${model}`);
                
                const result = await retryWithBackoff(async () => {
                  const response = await fetch(config.url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...config.headers
                    },
                    body: JSON.stringify({
                      model,
                      max_tokens: length === 'court' ? 512 : length === 'long' ? 1024 : 768,
                      messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorData}`);
                  }

                  const data = await response.json();
                  const content = data.content[0].text;
                  
                  if (!content || content.trim().length < 100) {
                    throw new Error('Contenu généré insuffisant');
                  }
                  
                  return content;
                });

                console.log(`✅ Succès avec Claude ${model}`);
                return result;

              } catch (error) {
                console.error(`❌ Erreur Claude ${model}:`, error.message);
                continue;
              }
            }
          }

        } catch (error) {
          console.error(`💥 Échec complet du service ${modelType}:`, error.message);
          continue;
        }
      }

      // === FALLBACK DE SECOURS: TEMPLATE BASIQUE ===
      console.log('🚨 Fallback: génération de template basique');
      return generateBasicTemplate(context, typeCourrier, tone, length);
    }

    // === TEMPLATE DE SECOURS ===
    function generateBasicTemplate(context: any, type: string, tone: string, length: string): string {
      const templates = {
        'reclamation_interne': `Madame, Monsieur,

Je vous écris concernant le refus de prise en charge de mon sinistre ${context.typeSinistre} survenu le ${context.dateSinistre}, pour un montant de ${context.montantRefuse}€.

Votre refus du ${context.refusDate} ne me paraît pas justifié au regard de mon contrat d'assurance n°${context.policeNumber}.

${tone === 'ferme' ? 'Je conteste formellement cette décision et' : 'Je souhaiterais que vous reconsidériez cette décision et que vous'} procédiez à un réexamen de mon dossier.

Je reste à votre disposition pour tout complément d'information.

Cordialement,
${context.client}`,

        'mediation': `Madame, Monsieur le Médiateur,

Je sollicite votre intervention dans le cadre d'un litige avec ${context.compagnieAssurance} concernant un sinistre ${context.typeSinistre}.

Mon assureur a refusé la prise en charge d'un sinistre de ${context.montantRefuse}€ survenu le ${context.dateSinistre}. 

Je considère ce refus injustifié et souhaiterais que vous examiniez ce dossier.

Cordialement,
${context.client}`,

        'mise_en_demeure': `MISE EN DEMEURE

Madame, Monsieur,

Par la présente, je vous mets en demeure de procéder au règlement de mon sinistre ${context.typeSinistre} d'un montant de ${context.montantRefuse}€.

Votre refus du ${context.refusDate} n'est pas conforme aux obligations contractuelles.

Vous disposez d'un délai de 30 jours pour régulariser la situation, faute de quoi je me verrai contraint d'engager des poursuites.

${context.client}`
      };

      return templates[type] || templates['reclamation_interne'];
    }

    // Générer le contenu avec le système de fallback intelligent
    const generatedContent = await generateWithAI(preferredModel);

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