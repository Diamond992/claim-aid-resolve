import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TypeSinistre {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  actif: boolean;
  ordre_affichage: number;
  created_at: string;
  updated_at: string;
}

export interface TypeCourrier {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  actif: boolean;
  ordre_affichage: number;
  created_at: string;
  updated_at: string;
}

export interface SinistreCourrierMapping {
  id: string;
  type_sinistre_id: string;
  type_courrier_id: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
  types_sinistres?: TypeSinistre;
  types_courriers?: TypeCourrier;
}

export const useTypesManagement = () => {
  const queryClient = useQueryClient();

  // Fetch types sinistres
  const { data: typesSinistres = [], isLoading: loadingSinistres } = useQuery({
    queryKey: ['types-sinistres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('types_sinistres')
        .select('*')
        .order('ordre_affichage', { ascending: true });

      if (error) throw error;
      return data as TypeSinistre[];
    },
  });

  // Fetch types courriers
  const { data: typesCourriers = [], isLoading: loadingCourriers } = useQuery({
    queryKey: ['types-courriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('types_courriers')
        .select('*')
        .order('ordre_affichage', { ascending: true });

      if (error) throw error;
      return data as TypeCourrier[];
    },
  });

  // Fetch mappings with related data
  const { data: mappings = [], isLoading: loadingMappings } = useQuery({
    queryKey: ['sinistre-courrier-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sinistre_courrier_mapping')
        .select(`
          *,
          types_sinistres (*),
          types_courriers (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SinistreCourrierMapping[];
    },
  });

  // Create type sinistre
  const createTypeSinistreMutation = useMutation({
    mutationFn: async (data: Omit<TypeSinistre, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('types_sinistres')
        .insert({
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-sinistres'] });
      toast.success("Type de sinistre créé avec succès");
    },
    onError: (error) => {
      console.error('Error creating type sinistre:', error);
      toast.error("Erreur lors de la création du type de sinistre");
    },
  });

  // Update type sinistre
  const updateTypeSinistreMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TypeSinistre> & { id: string }) => {
      const { error } = await supabase
        .from('types_sinistres')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-sinistres'] });
      toast.success("Type de sinistre mis à jour");
    },
    onError: (error) => {
      console.error('Error updating type sinistre:', error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete type sinistre
  const deleteTypeSinistreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('types_sinistres')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-sinistres'] });
      toast.success("Type de sinistre supprimé");
    },
    onError: (error) => {
      console.error('Error deleting type sinistre:', error);
      toast.error("Erreur lors de la suppression");
    },
  });

  // Create type courrier
  const createTypeCourrierMutation = useMutation({
    mutationFn: async (data: Omit<TypeCourrier, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('types_courriers')
        .insert({
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-courriers'] });
      toast.success("Type de courrier créé avec succès");
    },
    onError: (error) => {
      console.error('Error creating type courrier:', error);
      toast.error("Erreur lors de la création du type de courrier");
    },
  });

  // Update type courrier
  const updateTypeCourrierMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TypeCourrier> & { id: string }) => {
      const { error } = await supabase
        .from('types_courriers')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-courriers'] });
      toast.success("Type de courrier mis à jour");
    },
    onError: (error) => {
      console.error('Error updating type courrier:', error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete type courrier
  const deleteTypeCourrierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('types_courriers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-courriers'] });
      toast.success("Type de courrier supprimé");
    },
    onError: (error) => {
      console.error('Error deleting type courrier:', error);
      toast.error("Erreur lors de la suppression");
    },
  });

  // Update mapping
  const updateMappingMutation = useMutation({
    mutationFn: async ({ 
      typeSinistreId, 
      typeCourrieId, 
      actif 
    }: { 
      typeSinistreId: string; 
      typeCourrieId: string; 
      actif: boolean; 
    }) => {
      const { error } = await supabase
        .from('sinistre_courrier_mapping')
        .update({ actif })
        .eq('type_sinistre_id', typeSinistreId)
        .eq('type_courrier_id', typeCourrieId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinistre-courrier-mappings'] });
      toast.success("Association mise à jour");
    },
    onError: (error) => {
      console.error('Error updating mapping:', error);
      toast.error("Erreur lors de la mise à jour de l'association");
    },
  });

  return {
    // Data
    typesSinistres,
    typesCourriers,
    mappings,
    
    // Loading states
    loadingSinistres,
    loadingCourriers,
    loadingMappings,
    
    // Mutations
    createTypeSinistre: createTypeSinistreMutation.mutate,
    updateTypeSinistre: updateTypeSinistreMutation.mutate,
    deleteTypeSinistre: deleteTypeSinistreMutation.mutate,
    
    createTypeCourrier: createTypeCourrierMutation.mutate,
    updateTypeCourrier: updateTypeCourrierMutation.mutate,
    deleteTypeCourrier: deleteTypeCourrierMutation.mutate,
    
    updateMapping: updateMappingMutation.mutate,
    
    // Pending states
    isCreatingTypeSinistre: createTypeSinistreMutation.isPending,
    isUpdatingTypeSinistre: updateTypeSinistreMutation.isPending,
    isDeletingTypeSinistre: deleteTypeSinistreMutation.isPending,
    
    isCreatingTypeCourrier: createTypeCourrierMutation.isPending,
    isUpdatingTypeCourrier: updateTypeCourrierMutation.isPending,
    isDeletingTypeCourrier: deleteTypeCourrierMutation.isPending,
    
    isUpdatingMapping: updateMappingMutation.isPending,
  };
};