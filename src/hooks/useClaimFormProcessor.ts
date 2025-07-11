
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

  const validateJWTToken = (session: any): boolean => {
    if (!session?.access_token) return false;
    
    try {
      // Decode JWT payload (basic validation)
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        console.error('JWT token expired:', { exp: payload.exp, now });
        return false;
      }
      
      // Check if user ID matches
      if (payload.sub !== userId) {
        console.error('JWT token user ID mismatch:', { tokenUserId: payload.sub, expectedUserId: userId });
        return false;
      }
      
      console.log('JWT token validated successfully');
      return true;
    } catch (error) {
      console.error('JWT token validation failed:', error);
      return false;
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('Refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return false;
      }
      
      if (!session) {
        console.error('No session after refresh');
        return false;
      }
      
      console.log('Session refreshed successfully');
      return validateJWTToken(session);
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  };

  const checkDatabaseSession = async (): Promise<boolean> => {
    try {
      console.log('Checking database session...');
      const { data, error } = await supabase.rpc('get_user_role', { user_id: userId });
      
      if (error) {
        console.error('Database session check error:', error);
        return false;
      }
      
      console.log('Database session check successful, user role:', data);
      return true;
    } catch (error) {
      console.error('Database session check failed:', error);
      return false;
    }
  };

  const validateSession = async (attemptRefresh = true): Promise<boolean> => {
    try {
      console.log('Starting session validation...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        return false;
      }
      
      if (!session) {
        console.error('No session found');
        return false;
      }
      
      if (session.user.id !== userId) {
        console.error('Session user ID mismatch:', { sessionUserId: session.user.id, expectedUserId: userId });
        return false;
      }
      
      // Validate JWT token
      if (!validateJWTToken(session)) {
        if (attemptRefresh) {
          console.log('JWT token invalid, attempting refresh...');
          return await refreshSession();
        }
        return false;
      }
      
      // Check database session context
      const dbSessionValid = await checkDatabaseSession();
      if (!dbSessionValid && attemptRefresh) {
        console.log('Database session invalid, attempting refresh...');
        const refreshed = await refreshSession();
        if (refreshed) {
          return await checkDatabaseSession();
        }
        return false;
      }
      
      console.log('Session validated successfully for user:', userId);
      return dbSessionValid;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  const processClaimFormDataWithRetry = async (maxRetries = 3): Promise<boolean> => {
    if (!userId) {
      console.error('No userId provided');
      return false;
    }

    const storedData = localStorage.getItem('claimFormData');
    if (!storedData) {
      console.log('No claim form data in localStorage');
      return false;
    }

    setIsProcessing(true);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Processing attempt ${attempt}/${maxRetries}`);
        
        // Validate session before attempting insert
        const isSessionValid = await validateSession(attempt === 1);
        if (!isSessionValid) {
          console.error(`Session validation failed on attempt ${attempt}`);
          if (attempt < maxRetries) {
            // Exponential backoff with session refresh attempt
            console.log(`Waiting ${attempt * 2000}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          toast.error('Session invalide. Veuillez vous reconnecter.');
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
    
    setIsProcessing(false);
    return false;
  };

  const processClaimFormData = async (): Promise<boolean> => {
    const result = await processClaimFormDataWithRetry();
    setIsProcessing(false);
    return result;
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

  // Remove automatic processing - let Dashboard trigger it manually
  // This ensures the user is fully authenticated before processing
  
  return { isProcessing, processClaimFormData };
};
