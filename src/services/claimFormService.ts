import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { refreshSession, validateSession } from '@/utils/sessionValidator';
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

export const processClaimFormDataWithRetry = async (userId: string, maxRetries = 3): Promise<boolean> => {
  const storedData = localStorage.getItem('claimFormData');
  if (!storedData) {
    console.log('No claim form data in localStorage');
    return false;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Processing attempt ${attempt}/${maxRetries}`);
      
      // Force session refresh and validation on every attempt
      console.log(`Forcing session refresh on attempt ${attempt}`);
      const refreshSuccess = await refreshSession();
      if (!refreshSuccess) {
        console.error(`Session refresh failed on attempt ${attempt}`);
        if (attempt < maxRetries) {
          console.log(`Waiting ${attempt * 2000}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        toast.error('Impossible de rafraîchir la session. Veuillez vous reconnecter.');
        return false;
      }

      // Wait longer for the refreshed token to propagate to the database
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify session is valid in database context
      const sessionValid = await validateSession(userId, false);
      if (!sessionValid) {
        console.error(`Session validation failed on attempt ${attempt}`);
        if (attempt < maxRetries) {
          console.log(`Session invalid, waiting ${attempt * 3000}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
          continue;
        }
        toast.error('Session invalide après rafraîchissement. Veuillez vous reconnecter.');
        return false;
      }

      const claimData: ClaimFormData = JSON.parse(storedData);
      console.log('Processing claim data:', { contractType: claimData.contractType, userId });
      
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

      console.log('Inserting dossier data:', dossierData);

      const { data, error } = await supabase
        .from('dossiers')
        .insert(dossierData)
        .select()
        .single();

      if (error) {
        console.error(`Insert error on attempt ${attempt}:`, error);
        
        // Handle specific RLS errors
        if (error.message.includes('row-level security policy')) {
          console.error('RLS policy violation details:', {
            error: error.message,
            userId,
            attemptNumber: attempt,
            sessionChecked: true
          });
          
          if (attempt < maxRetries) {
            console.log(`RLS policy violation, refreshing session and retrying in ${attempt * 2000}ms...`);
            // Try to refresh session before retry
            await refreshSession();
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          
          toast.error('Erreur d\'autorisation persistante. Veuillez vous déconnecter et reconnecter, puis réessayer.');
          return false;
        }
        
        // For other errors, don't retry
        toast.error('Erreur lors de la création du dossier');
        return false;
      }

      console.log('Dossier created successfully:', data);
      
      // Clear localStorage after successful creation
      localStorage.removeItem('claimFormData');
      
      toast.success('Votre dossier a été créé avec succès !');
      return true;

    } catch (error) {
      console.error(`Processing error on attempt ${attempt}:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      toast.error('Erreur lors du traitement des données du formulaire');
      return false;
    }
  }
  
  return false;
};