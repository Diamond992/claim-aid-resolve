import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch templates with related types
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modeles_courriers')
        .select(`
          *,
          types_sinistres!fk_modeles_type_sinistre(code, libelle),
          types_courriers!fk_modeles_type_courrier(code, libelle)
        `)
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

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: {
      nom_modele: string;
      type_sinistre: 'auto' | 'habitation' | 'sante';
      type_courrier: 'reclamation_interne' | 'mediation' | 'mise_en_demeure';
      template_content: string;
      variables_requises: string[];
      actif: boolean;
    }) => {
      // Get the IDs for the type codes
      const { data: sinistreData } = await supabase
        .from('types_sinistres')
        .select('id')
        .eq('code', templateData.type_sinistre)
        .single();
        
      const { data: courrierData } = await supabase
        .from('types_courriers')
        .select('id')
        .eq('code', templateData.type_courrier)
        .single();

      if (!sinistreData || !courrierData) {
        throw new Error('Type sinistre ou courrier introuvable');
      }

      const { error } = await supabase
        .from('modeles_courriers')
        .insert({
          nom_modele: templateData.nom_modele,
          type_sinistre_id: sinistreData.id,
          type_courrier_id: courrierData.id,
          template_content: templateData.template_content,
          variables_requises: templateData.variables_requises as any,
          actif: templateData.actif,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success("Modèle créé avec succès");
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error("Erreur lors de la création du modèle");
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      templateData 
    }: { 
      id: string; 
      templateData: {
        nom_modele: string;
        type_sinistre: 'auto' | 'habitation' | 'sante';
        type_courrier: 'reclamation_interne' | 'mediation' | 'mise_en_demeure';
        template_content: string;
        variables_requises: string[];
        actif: boolean;
      }
    }) => {
      // Get the IDs for the type codes
      const { data: sinistreData } = await supabase
        .from('types_sinistres')
        .select('id')
        .eq('code', templateData.type_sinistre)
        .single();
        
      const { data: courrierData } = await supabase
        .from('types_courriers')
        .select('id')  
        .eq('code', templateData.type_courrier)
        .single();

      if (!sinistreData || !courrierData) {
        throw new Error('Type sinistre ou courrier introuvable');
      }

      const { error } = await supabase
        .from('modeles_courriers')
        .update({
          nom_modele: templateData.nom_modele,
          type_sinistre_id: sinistreData.id,
          type_courrier_id: courrierData.id,
          template_content: templateData.template_content,
          variables_requises: templateData.variables_requises as any,
          actif: templateData.actif,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success("Modèle mis à jour avec succès");
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error("Erreur lors de la mise à jour du modèle");
    },
  });

  return {
    templates,
    isLoading,
    deleteTemplate: deleteTemplateMutation.mutate,
    updateTemplateStatus: updateTemplateStatusMutation.mutate,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
  };
};