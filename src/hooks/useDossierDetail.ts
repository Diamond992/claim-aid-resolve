import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export const useDossierDetail = (dossierId: string) => {
  const { userRole, isAdmin } = useUserRole();
  
  return useQuery({
    queryKey: ['dossier-detail', dossierId],
    queryFn: async () => {
      // Debug: Check authentication status
      const { data: { user } } = await supabase.auth.getUser();
      console.log('useDossierDetail - Auth user:', user?.id);
      console.log('useDossierDetail - User role:', userRole);
      console.log('useDossierDetail - Is admin:', isAdmin);
      console.log('useDossierDetail - Fetching dossier:', dossierId);

      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select(`
          *,
          profiles:client_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', dossierId)
        .maybeSingle();

      if (dossierError) {
        console.error('useDossierDetail - Dossier fetch error:', dossierError);
        throw dossierError;
      }

      if (!dossier) {
        console.warn('useDossierDetail - No dossier found for ID:', dossierId);
        const errorMessage = isAdmin 
          ? `Dossier not found in database for ID: ${dossierId}`
          : `Dossier not found or access denied for ID: ${dossierId}`;
        throw new Error(errorMessage);
      }

      console.log('useDossierDetail - Dossier found:', dossier.id);

      // Fetch related data in parallel
      const [documentsResponse, courriersResponse, echeancesResponse] = await Promise.all([
        supabase
          .from('documents')
          .select('*')
          .eq('dossier_id', dossierId),
        
        supabase
          .from('courriers_projets')
          .select('*')
          .eq('dossier_id', dossierId)
          .order('date_creation', { ascending: false }),
        
        supabase
          .from('echeances')
          .select('*')
          .eq('dossier_id', dossierId)
          .order('date_limite', { ascending: true })
      ]);

      if (documentsResponse.error) {
        console.error('useDossierDetail - Documents fetch error:', documentsResponse.error);
        throw documentsResponse.error;
      }
      if (courriersResponse.error) {
        console.error('useDossierDetail - Courriers fetch error:', courriersResponse.error);
        throw courriersResponse.error;
      }
      if (echeancesResponse.error) {
        console.error('useDossierDetail - Echeances fetch error:', echeancesResponse.error);
        throw echeancesResponse.error;
      }

      console.log('useDossierDetail - Data fetched successfully:', {
        documentsCount: documentsResponse.data?.length || 0,
        courriersCount: courriersResponse.data?.length || 0,
        echeancesCount: echeancesResponse.data?.length || 0
      });

      return {
        dossier,
        documents: documentsResponse.data || [],
        courriers: courriersResponse.data || [],
        echeances: echeancesResponse.data || []
      };
    },
    enabled: !!dossierId
  });
};