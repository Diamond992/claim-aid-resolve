
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TypeSinistre = 'auto' | 'habitation' | 'sante' | 'autre';

// Function to map contract type to database enum
const mapContractTypeToSinistre = (contractType: string): TypeSinistre => {
  const lowerType = contractType.toLowerCase();
  
  if (lowerType.includes('auto') || lowerType.includes('vehicule')) {
    return 'auto';
  }
  if (lowerType.includes('habitation') || lowerType.includes('logement') || lowerType.includes('maison')) {
    return 'habitation';
  }
  if (lowerType.includes('sante') || lowerType.includes('medical') || lowerType.includes('soin')) {
    return 'sante';
  }
  
  return 'autre';
};

interface ClaimFormData {
  contractType: string;
  accidentDate: string;
  refusalDate: string;
  refusalReason?: string;
  claimedAmount: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  policyNumber?: string;
  insuranceCompany?: string;
  description?: string;
  hasExpertise?: string;
  previousExchanges?: string;
}

export const processClaimFormData = async (authContext: any): Promise<boolean> => {
  console.log('🚀 Starting claim form processing...');

  try {
    // Step 1: Check authentication state
    console.log('🔐 Step 1: Checking authentication state...');
    
    // Wait for auth to stabilize if still loading
    if (authContext.isLoading) {
      console.log('⏳ Auth still loading, waiting...');
      // Simple wait for auth to stabilize
      let attempts = 0;
      while (authContext.isLoading && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    const userId = authContext.user?.id;
    if (!userId) {
      console.error('❌ No user ID available after auth check');
      toast.error("Utilisateur non authentifié. Veuillez vous reconnecter.");
      return false;
    }

    console.log('✅ Authentication verified for user:', userId.substring(0, 8) + '...');

    // Step 2: Validate claim data
    console.log('📋 Step 2: Validating claim form data...');
    const claimData = localStorage.getItem('claimFormData');
    
    if (!claimData) {
      console.error('❌ No claim data found in localStorage');
      toast.error("Aucune donnée de réclamation trouvée. Veuillez recommencer le processus.");
      return false;
    }

    let parsedData: ClaimFormData;
    try {
      parsedData = JSON.parse(claimData);
      console.log('📊 Parsed claim data:', {
        contractType: parsedData.contractType,
        accidentDate: parsedData.accidentDate,
        refusalDate: parsedData.refusalDate,
        claimedAmount: parsedData.claimedAmount,
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        email: parsedData.email
      });
    } catch (error) {
      console.error('❌ Failed to parse claim data:', error);
      toast.error("Données de réclamation corrompues. Veuillez recommencer.");
      return false;
    }

    // Validate required fields with detailed logging
    const requiredFields = [
      { field: 'contractType', value: parsedData.contractType },
      { field: 'accidentDate', value: parsedData.accidentDate },
      { field: 'refusalDate', value: parsedData.refusalDate },
      { field: 'claimedAmount', value: parsedData.claimedAmount },
      { field: 'firstName', value: parsedData.firstName },
      { field: 'lastName', value: parsedData.lastName },
      { field: 'email', value: parsedData.email },
      { field: 'address', value: parsedData.address }
    ];
    
    const missingFields = requiredFields.filter(({ field, value }) => {
      const isEmpty = !value || value.toString().trim() === '';
      if (isEmpty) {
        console.error(`❌ Missing field: ${field}, value:`, value);
      }
      return isEmpty;
    });
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(f => f.field);
      console.error('❌ Missing required fields:', fieldNames);
      toast.error(`Champs requis manquants: ${fieldNames.join(', ')}`);
      return false;
    }

    // Validate claimed amount
    const claimedAmount = parseFloat(parsedData.claimedAmount);
    if (isNaN(claimedAmount) || claimedAmount <= 0) {
      console.error('❌ Invalid claimed amount:', parsedData.claimedAmount);
      toast.error("Le montant réclamé doit être un nombre positif valide.");
      return false;
    }

    // Validate date format
    const accidentDate = new Date(parsedData.accidentDate);
    const refusalDate = new Date(parsedData.refusalDate);
    
    if (isNaN(accidentDate.getTime())) {
      console.error('❌ Invalid accident date:', parsedData.accidentDate);
      toast.error("Date du sinistre invalide.");
      return false;
    }
    
    if (isNaN(refusalDate.getTime())) {
      console.error('❌ Invalid refusal date:', parsedData.refusalDate);
      toast.error("Date du refus invalide.");
      return false;
    }

    console.log('✅ Claim data validation passed');

    // Step 3: Prepare dossier data
    console.log('📄 Step 3: Preparing dossier data...');
    const dossierData = {
      client_id: userId,
      type_sinistre: mapContractTypeToSinistre(parsedData.contractType),
      compagnie_assurance: parsedData.insuranceCompany || 'Non spécifiée',
      police_number: parsedData.policyNumber || 'Non spécifié',
      date_sinistre: parsedData.accidentDate,
      refus_date: parsedData.refusalDate,
      montant_refuse: claimedAmount,
      motif_refus: parsedData.refusalReason || null,
      statut: 'nouveau' as const,
    };

    console.log('📊 Dossier data prepared:', {
      type_sinistre: dossierData.type_sinistre,
      compagnie_assurance: dossierData.compagnie_assurance,
      montant_refuse: dossierData.montant_refuse
    });

    // Step 4: Insert dossier with authentication check
    console.log('💾 Step 4: Inserting dossier into database...');
    
    // Final authentication check before database operation
    if (!authContext.user?.id) {
      console.error('❌ User no longer authenticated before database operation');
      toast.error("Problème d'authentification. Veuillez vous reconnecter.");
      return false;
    }

    const { data: insertedDossier, error } = await supabase
      .from('dossiers')
      .insert(dossierData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database insert error:', error);
      
      if (error.code === 'PGRST116' || error.message?.includes('JWT')) {
        toast.error("Problème d'authentification lors de la création du dossier. Veuillez vous reconnecter.");
      } else {
        toast.error("Erreur lors de la création du dossier: " + (error.message || 'Erreur inconnue'));
      }
      
      return false;
    }

    console.log('✅ Dossier created successfully:', insertedDossier.id);

    // Step 5: Clean up and show success
    localStorage.removeItem('claimFormData');
    toast.success("Votre dossier a été créé avec succès !");
    
    return true;

  } catch (error) {
    console.error('❌ Claim form processing error:', error);
    toast.error("Une erreur inattendue s'est produite lors du traitement de votre réclamation.");
    return false;
  }
};
