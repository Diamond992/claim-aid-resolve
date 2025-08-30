import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserDossiers = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-dossiers', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          compagnie_assurance,
          type_sinistre,
          statut,
          montant_refuse,
          created_at,
          courriers:courriers_projets (
            id,
            statut
          ),
          echeances:echeances (
            id,
            statut,
            date_limite
          ),
          documents:documents (
            id
          )
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};