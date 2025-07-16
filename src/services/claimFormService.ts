import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapContractTypeToSinistre } from '@/utils/contractMapper';
import { executeWithAuthRetry, verifyAuthenticationState } from '@/utils/authVerification';
import { runAuthDiagnostics } from '@/utils/authDiagnostics';

interface ClaimFormData {
  contractType: string;
  incidentDate: Date | null;
  refusalDate: Date | null;
  refusalReason: string;
  claimedAmount: string;
  description: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    policyNumber: string;
  };
}

export const processClaimFormData = async (userId: string): Promise<boolean> => {
  console.log('🚀 Starting claim form processing for user:', userId);
  
  // Step 1: Basic validation
  if (!userId) {
    console.error('❌ No userId provided for dossier creation');
    toast.error('Erreur d\'authentification. Veuillez vous reconnecter.');
    return false;
  }

  const storedData = localStorage.getItem('claimFormData');
  if (!storedData) {
    console.log('❌ No claim form data in localStorage');
    return false;
  }

  try {
    // Step 2: Comprehensive authentication verification
    console.log('🔍 Verifying authentication state...');
    const authState = await verifyAuthenticationState();
    
    if (!authState.isValid) {
      console.error('❌ Authentication verification failed:', authState.error);
      
      // Run comprehensive diagnostics to understand the issue
      console.log('🔍 Running authentication diagnostics...');
      const diagnostics = await runAuthDiagnostics();
      
      console.log('📊 Authentication Diagnostics Results:');
      console.log('- Client Session:', diagnostics.clientSession);
      console.log('- Database Connection:', diagnostics.databaseConnection);
      console.log('- RLS Policy Test:', diagnostics.rlsPolicyTest);
      console.log('- Recommendations:', diagnostics.recommendations);
      
      toast.error('Problème d\'authentification. Consultez la console pour plus de détails.');
      return false;
    }

    console.log('✅ Authentication verification passed');

    // Step 3: Parse and validate claim data
    console.log('📝 Parsing claim data...');
    const claimData: ClaimFormData = JSON.parse(storedData);
    
    if (!claimData.contractType || !claimData.personalInfo?.policyNumber) {
      console.error('❌ Missing required fields in claim data');
      toast.error('Données incomplètes. Veuillez remplir tous les champs requis.');
      return false;
    }

    const montantRefuse = parseFloat(claimData.claimedAmount);
    if (isNaN(montantRefuse) || montantRefuse < 0) {
      console.error('❌ Invalid amount:', claimData.claimedAmount);
      toast.error('Montant invalide. Veuillez saisir un montant valide.');
      return false;
    }

    console.log('✅ Claim data validation passed');

    // Step 4: Prepare dossier data
    const dossierData = {
      client_id: userId,
      type_sinistre: mapContractTypeToSinistre(claimData.contractType),
      date_sinistre: claimData.incidentDate ? new Date(claimData.incidentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      refus_date: claimData.refusalDate ? new Date(claimData.refusalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      motif_refus: claimData.refusalReason?.trim() || 'Non spécifié',
      montant_refuse: montantRefuse,
      police_number: claimData.personalInfo.policyNumber.trim(),
      compagnie_assurance: 'Non renseignée',
    };

    console.log('📋 Prepared dossier data:', { ...dossierData, client_id: '[USER_ID]' });

    // Step 5: Execute database operation with comprehensive retry logic
    const result = await executeWithAuthRetry(
      async () => {
        console.log('💾 Attempting to create dossier...');
        const { data, error } = await supabase
          .from('dossiers')
          .insert(dossierData)
          .select()
          .single();

        if (error) {
          console.error('❌ Database error:', error);
          throw error;
        }

        console.log('✅ Dossier created successfully:', data);
        return data;
      },
      'Dossier Creation',
      3
    );

    if (result) {
      // Success - clean up and notify user
      localStorage.removeItem('claimFormData');
      toast.success('Votre dossier a été créé avec succès !');
      console.log('🎉 Claim processing completed successfully');
      return true;
    } else {
      // Failed after retries
      console.error('❌ Dossier creation failed after retries');
      toast.error('Impossible de créer le dossier. Veuillez réessayer.');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error in claim processing:', error);
    toast.error('Erreur technique lors du traitement. Veuillez réessayer.');
    return false;
  }
};