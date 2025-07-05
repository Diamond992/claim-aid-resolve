
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Configuration {
  id: string;
  cle: string;
  valeur: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  modifiable: boolean;
  updated_by: string | null;
  updated_at: string;
}

export const useConfiguration = () => {
  const queryClient = useQueryClient();

  // Fetch configurations
  const { data: configurations = [], isLoading } = useQuery({
    queryKey: ['admin-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuration')
        .select(`
          *,
          profiles:updated_by (
            first_name,
            last_name,
            email
          )
        `)
        .order('cle', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Update configuration mutation
  const updateConfigurationMutation = useMutation({
    mutationFn: async ({ id, valeur }: { id: string; valeur: string }) => {
      const { error } = await supabase
        .from('configuration')
        .update({ 
          valeur,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-configurations'] });
      toast.success("Configuration mise à jour avec succès");
    },
    onError: (error) => {
      console.error('Error updating configuration:', error);
      toast.error("Erreur lors de la mise à jour de la configuration");
    },
  });

  return {
    configurations,
    isLoading,
    updateConfiguration: updateConfigurationMutation.mutate,
    isUpdating: updateConfigurationMutation.isPending,
  };
};
