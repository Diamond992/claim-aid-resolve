
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useClaimFormProcessor = (userId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processClaimFormData = async () => {
    if (!userId) return false;

    const storedData = localStorage.getItem('claimFormData');
    if (!storedData) return false;

    setIsProcessing(true);
    
    try {
      const claimData: ClaimFormData = JSON.parse(storedData);
      
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

      const { data, error } = await supabase
        .from('dossiers')
        .insert(dossierData)
        .select()
        .single();

      if (error) {
        console.error('Error creating dossier:', error);
        toast.error('Erreur lors de la création du dossier');
        return false;
      }

      // Clear localStorage after successful creation
      localStorage.removeItem('claimFormData');
      
      toast.success('Votre dossier a été créé avec succès !');
      return true;
    } catch (error) {
      console.error('Error processing claim form data:', error);
      toast.error('Erreur lors du traitement des données du formulaire');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const mapContractTypeToSinistre = (contractType: string): "auto" | "habitation" | "sante" | "autre" => {
    const mapping: Record<string, "auto" | "habitation" | "sante" | "autre"> = {
      'auto': 'auto',
      'habitation': 'habitation',
      'sante': 'sante',
      'prevoyance': 'autre',
      'vie': 'autre',
      'responsabilite': 'autre',
      'autre': 'autre'
    };
    return mapping[contractType] || 'autre';
  };

  useEffect(() => {
    if (userId) {
      processClaimFormData();
    }
  }, [userId]);

  return { isProcessing, processClaimFormData };
};
