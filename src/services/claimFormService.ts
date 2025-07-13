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
  // Validation d'authentification renforcée
  if (!userId) {
    console.error('No userId provided for dossier creation');
    toast.error('Erreur d\'authentification. Veuillez vous reconnecter.');
    return false;
  }

  const storedData = localStorage.getItem('claimFormData');
  if (!storedData) {
    console.log('No claim form data in localStorage');
    return false;
  }

  try {
    // Vérifier que la session est active avant de procéder
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session validation failed:', sessionError);
      toast.error('Session expirée. Veuillez vous reconnecter.');
      return false;
    }

    console.log('Processing claim for authenticated user:', userId);

    // Parse et validation des données
    const claimData: ClaimFormData = JSON.parse(storedData);
    
    // Validation des données requises
    if (!claimData.contractType || !claimData.personalInfo?.policyNumber) {
      console.error('Missing required fields in claim data');
      toast.error('Données incomplètes. Veuillez remplir tous les champs requis.');
      return false;
    }

    // Validation et conversion des montants
    const montantRefuse = parseFloat(claimData.claimedAmount);
    if (isNaN(montantRefuse) || montantRefuse < 0) {
      console.error('Invalid amount:', claimData.claimedAmount);
      toast.error('Montant invalide. Veuillez saisir un montant valide.');
      return false;
    }

    // Map form data to database schema avec validation
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

    console.log('Attempting to create dossier with data:', { ...dossierData, client_id: '[USER_ID]' });

    // Tentative d'insertion avec retry en cas d'échec lié à l'authentification
    let attempt = 0;
    const maxAttempts = 2;
    
    while (attempt < maxAttempts) {
      try {
        const { data, error } = await supabase
          .from('dossiers')
          .insert(dossierData)
          .select()
          .single();

        if (error) {
          console.error(`Dossier creation error (attempt ${attempt + 1}):`, error);
          
          // Si c'est un problème de RLS, essayer une fois de plus après un délai
          if (error.message?.includes('row-level security') && attempt === 0) {
            console.log('RLS error detected, retrying after delay...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempt++;
            continue;
          }
          
          toast.error(`Erreur lors de la création du dossier: ${error.message}`);
          return false;
        }

        console.log('Dossier created successfully:', data);
        localStorage.removeItem('claimFormData');
        toast.success('Votre dossier a été créé avec succès !');
        return true;

      } catch (insertError) {
        console.error(`Insert attempt ${attempt + 1} failed:`, insertError);
        if (attempt === maxAttempts - 1) {
          throw insertError;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return false;

  } catch (error) {
    console.error('Error processing claim:', error);
    toast.error('Erreur technique lors du traitement. Veuillez réessayer.');
    return false;
  }
};