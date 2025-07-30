import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDossierDetail = (dossierId: string) => {
  return useQuery({
    queryKey: ['dossier-detail', dossierId],
    queryFn: async () => {
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
        .single();

      if (dossierError) throw dossierError;

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

      if (documentsResponse.error) throw documentsResponse.error;
      if (courriersResponse.error) throw courriersResponse.error;
      if (echeancesResponse.error) throw echeancesResponse.error;

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