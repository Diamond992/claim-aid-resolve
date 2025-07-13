import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapContractTypeToSinistre } from '@/utils/contractMapper';

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
  const storedData = localStorage.getItem('claimFormData');
  if (!storedData) {
    console.log('No claim form data in localStorage');
    return false;
  }

  try {
    // Parse claim data
    const claimData: ClaimFormData = JSON.parse(storedData);
    console.log('Processing claim for user:', userId);
    
    // Map form data to database schema
    const dossierData = {
      client_id: userId,
      type_sinistre: mapContractTypeToSinistre(claimData.contractType),
      date_sinistre: claimData.incidentDate ? new Date(claimData.incidentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      refus_date: claimData.refusalDate ? new Date(claimData.refusalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      motif_refus: claimData.refusalReason || 'Non spécifié',
      montant_refuse: parseFloat(claimData.claimedAmount) || 0,
      police_number: claimData.personalInfo.policyNumber || 'Non renseigné',
      compagnie_assurance: 'Non renseignée',
    };

    // Direct database insert with simple error handling
    const { data, error } = await supabase
      .from('dossiers')
      .insert(dossierData)
      .select()
      .single();

    if (error) {
      console.error('Error creating dossier:', error);
      toast.error('Erreur lors de la création du dossier. Veuillez réessayer.');
      return false;
    }

    console.log('Dossier created successfully:', data);
    localStorage.removeItem('claimFormData');
    toast.success('Votre dossier a été créé avec succès !');
    return true;

  } catch (error) {
    console.error('Error processing claim:', error);
    toast.error('Erreur lors du traitement. Veuillez réessayer.');
    return false;
  }
};