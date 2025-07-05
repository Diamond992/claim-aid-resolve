
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modeles_courriers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modeles_courriers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success("Modèle supprimé avec succès");
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error("Erreur lors de la suppression du modèle");
    },
  });

  // Update template status mutation
  const updateTemplateStatusMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase
        .from('modeles_courriers')
        .update({ 
          actif,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success("Statut du modèle mis à jour");
    },
    onError: (error) => {
      console.error('Error updating template status:', error);
      toast.error("Erreur lors de la mise à jour du statut");
    },
  });

  return {
    templates,
    isLoading,
    deleteTemplate: deleteTemplateMutation.mutate,
    updateTemplateStatus: updateTemplateStatusMutation.mutate,
  };
};
