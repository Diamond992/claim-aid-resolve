import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClaimFormData {
  contractType: string;
  accidentDate: string;
  refusalDate: string;
  refusalReason?: string;
  claimedAmount: string;
  firstName: string;
  lastName: string;
  email: string;
  policyNumber?: string;
  insuranceCompany?: string;
}

export const processClaimFormData = async (authContext: any): Promise<boolean> => {
  console.log('🚀 Starting claim form processing...');

  try {
    // Step 1: Ensure authentication is ready
    console.log('🔐 Step 1: Ensuring authentication...');
    
    const isAuthReady = await authContext.waitForAuth();
    if (!isAuthReady) {
      console.error('❌ Authentication not ready');
      toast.error("Problème d'authentification. Veuillez vous reconnecter.");
      return false;
    }

    const userId = authContext.user?.id;
    if (!userId) {
      console.error('❌ No user ID available');
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
    } catch (error) {
      console.error('❌ Failed to parse claim data:', error);
      toast.error("Données de réclamation corrompues. Veuillez recommencer.");
      return false;
    }

    // Validate required fields
    const requiredFields = ['contractType', 'accidentDate', 'refusalDate', 'claimedAmount', 'firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field => !parsedData[field as keyof ClaimFormData]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      toast.error(`Champs requis manquants: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate claimed amount
    const claimedAmount = parseFloat(parsedData.claimedAmount);
    if (isNaN(claimedAmount) || claimedAmount <= 0) {
      console.error('❌ Invalid claimed amount:', parsedData.claimedAmount);
      toast.error("Le montant réclamé doit être un nombre positif valide.");
      return false;
    }

    console.log('✅ Claim data validation passed');

    // Step 3: Prepare dossier data
    console.log('📄 Step 3: Preparing dossier data...');
    const dossierData = {
      client_id: userId,
      type_sinistre: parsedData.contractType,
      compagnie_assurance: parsedData.insuranceCompany || 'Non spécifiée',
      police_number: parsedData.policyNumber || 'Non spécifié',
      date_sinistre: parsedData.accidentDate,
      refus_date: parsedData.refusalDate,
      montant_refuse: claimedAmount,
      motif_refus: parsedData.refusalReason || null,
      statut: 'nouveau' as const,
    };

    console.log('📊 Dossier data prepared');

    // Step 4: Insert dossier with authentication check
    console.log('💾 Step 4: Inserting dossier into database...');
    
    // Double-check authentication before database operation
    const authCheck = await authContext.ensureAuthenticated();
    if (!authCheck) {
      console.error('❌ Authentication check failed before database operation');
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