import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CourrierGenerator } from "@/services/courrierGenerator";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface AICourrierParams {
  dossierId: string;
  typeCourrier: 'reclamation_interne' | 'mediation' | 'mise_en_demeure';
  tone?: 'ferme' | 'diplomatique';
  length?: 'court' | 'moyen' | 'long';
}

export const useAICourrierGenerator = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();

  const generateAICourrierMutation = useMutation({
    mutationFn: async ({ dossierId, typeCourrier, tone = 'ferme', length = 'moyen' }: AICourrierParams) => {
      if (!isAdmin) {
        throw new Error('Accès non autorisé: seuls les administrateurs peuvent générer des courriers');
      }
      // Générer le contenu avec l'IA
      const { data, error } = await supabase.functions.invoke('generate-ai-courrier', {
        body: { 
          dossierId, 
          typeCourrier,
          tone,
          length
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur lors de la génération');

      // Créer le courrier avec le contenu généré
      return await CourrierGenerator.createCourrier(
        dossierId,
        'ai-generated', // ID spécial pour les courriers générés par IA
        typeCourrier,
        data.contenu_genere
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier-detail'] });
      toast.success("Courrier généré par IA avec succès");
    },
    onError: (error) => {
      console.error('Error generating AI courrier:', error);
      toast.error("Erreur lors de la génération du courrier par IA");
    },
  });

  return {
    generateAICourrier: generateAICourrierMutation.mutate,
    isGenerating: generateAICourrierMutation.isPending,
  };
};