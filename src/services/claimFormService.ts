
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

// Function to clean corrupted data from localStorage
const cleanCorruptedData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Check if it's a corrupted object with _type and value properties
  if (data._type === 'undefined' && data.value === 'undefined') {
    return undefined;
  }

  // If it's an array, clean each element
  if (Array.isArray(data)) {
    return data.map(cleanCorruptedData);
  }

  // If it's an object, clean each property
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = cleanCorruptedData(value);
  }

  return cleaned;
};

// Function to validate if data is properly formatted
const isValidClaimData = (data: any): data is ClaimFormData => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for required fields and ensure they are strings (not objects)
  const requiredStringFields = ['contractType', 'accidentDate', 'refusalDate', 'claimedAmount', 'firstName', 'lastName', 'email', 'address'];
  
  for (const field of requiredStringFields) {
    const value = data[field];
    if (!value || typeof value !== 'string' || value.trim() === '') {
      console.error(`❌ Invalid or missing field: ${field}, type: ${typeof value}, value:`, value);
      return false;
    }
  }

  return true;
};

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

    // Step 2: Validate and clean claim data
    console.log('📋 Step 2: Validating and cleaning claim form data...');
    const claimData = localStorage.getItem('claimFormData');
    
    if (!claimData) {
      console.error('❌ No claim data found in localStorage');
      toast.error("Aucune donnée de réclamation trouvée. Veuillez recommencer le processus.");
      return false;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(claimData);
      console.log('📊 Raw parsed claim data:', parsedData);
    } catch (error) {
      console.error('❌ Failed to parse claim data:', error);
      localStorage.removeItem('claimFormData');
      toast.error("Données de réclamation corrompues. Veuillez recommencer.");
      return false;
    }

    // Clean corrupted data
    console.log('🧹 Cleaning potentially corrupted data...');
    const cleanedData = cleanCorruptedData(parsedData);
    console.log('📊 Cleaned claim data:', cleanedData);

    // Validate cleaned data
    if (!isValidClaimData(cleanedData)) {
      console.error('❌ Claim data validation failed after cleaning');
      localStorage.removeItem('claimFormData');
      toast.error("Les données du formulaire sont incomplètes ou corrompues. Veuillez recommencer en remplissant tous les champs requis.");
      return false;
    }

    console.log('✅ Claim data validation passed');

    // Validate claimed amount
    const claimedAmount = parseFloat(cleanedData.claimedAmount);
    if (isNaN(claimedAmount) || claimedAmount <= 0) {
      console.error('❌ Invalid claimed amount:', cleanedData.claimedAmount);
      toast.error("Le montant réclamé doit être un nombre positif valide.");
      localStorage.removeItem('claimFormData');
      return false;
    }

    // Validate date format
    const accidentDate = new Date(cleanedData.accidentDate);
    const refusalDate = new Date(cleanedData.refusalDate);
    
    if (isNaN(accidentDate.getTime())) {
      console.error('❌ Invalid accident date:', cleanedData.accidentDate);
      toast.error("Date du sinistre invalide.");
      localStorage.removeItem('claimFormData');
      return false;
    }
    
    if (isNaN(refusalDate.getTime())) {
      console.error('❌ Invalid refusal date:', cleanedData.refusalDate);
      toast.error("Date du refus invalide.");
      localStorage.removeItem('claimFormData');
      return false;
    }

    // Step 3: Prepare dossier data
    console.log('📄 Step 3: Preparing dossier data...');
    const dossierData = {
      client_id: userId,
      type_sinistre: mapContractTypeToSinistre(cleanedData.contractType),
      compagnie_assurance: cleanedData.insuranceCompany || 'Non spécifiée',
      police_number: cleanedData.policyNumber || 'Non spécifié',
      date_sinistre: cleanedData.accidentDate,
      refus_date: cleanedData.refusalDate,
      montant_refuse: claimedAmount,
      motif_refus: cleanedData.refusalReason || null,
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
    // Clean up corrupted data on any error
    localStorage.removeItem('claimFormData');
    toast.error("Une erreur inattendue s'est produite lors du traitement de votre réclamation.");
    return false;
  }
};
