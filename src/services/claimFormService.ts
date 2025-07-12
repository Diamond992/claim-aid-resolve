import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { refreshSession, validateSession } from '@/utils/sessionValidator';
import { mapContractTypeToSinistre } from '@/utils/contractMapper';
import { executeWithAuthRetry } from '@/utils/authVerification';

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

export const processClaimFormDataWithRetry = async (userId: string): Promise<boolean> => {
  const storedData = localStorage.getItem('claimFormData');
  if (!storedData) {
    console.log('No claim form data in localStorage');
    return false;
  }

  console.log(`🚀 Starting claim form processing for user: ${userId}`);

  try {
    // Parse claim data first
    const claimData: ClaimFormData = JSON.parse(storedData);
    console.log('📋 Claim data parsed:', { 
      contractType: claimData.contractType, 
      userId,
      hasPersonalInfo: !!claimData.personalInfo,
      hasIncidentDate: !!claimData.incidentDate 
    });
    
    // Map form data to database schema
    const dossierData = {
      client_id: userId,
      type_sinistre: mapContractTypeToSinistre(claimData.contractType),
      date_sinistre: claimData.incidentDate ? new Date(claimData.incidentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      refus_date: claimData.refusalDate ? new Date(claimData.refusalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      motif_refus: claimData.refusalReason || 'Non spécifié',
      montant_refuse: parseFloat(claimData.claimedAmount) || 0,
      police_number: claimData.personalInfo.policyNumber || 'Non renseigné',
      compagnie_assurance: 'Non renseignée', // Default value as it's required
    };

    console.log('💾 Prepared dossier data:', dossierData);

    // Use enhanced auth retry logic for the database operation
    const insertOperation = async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .insert(dossierData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    };

    const result = await executeWithAuthRetry(
      insertOperation,
      'création du dossier',
      3
    );

    if (result) {
      console.log('✅ Dossier created successfully:', result);
      localStorage.removeItem('claimFormData');
      toast.success('Votre dossier a été créé avec succès !');
      return true;
    }

    return false;

  } catch (error) {
    console.error('❌ Critical error in claim processing:', error);
    toast.error('Erreur critique lors du traitement. Veuillez contacter le support.');
    return false;
  }
};