import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CourrierGenerator } from "@/services/courrierGenerator";
import { toast } from "sonner";

export const useCourrierGenerator = () => {
  const queryClient = useQueryClient();

  const generateCourrierMutation = useMutation({
    mutationFn: async ({
      dossierId,
      templateId,
      typeCourrier,
      contenuGenere
    }: {
      dossierId: string;
      templateId: string;
      typeCourrier: 'reclamation_interne' | 'mediation' | 'mise_en_demeure';
      contenuGenere: string;
    }) => {
      return await CourrierGenerator.createCourrier(
        dossierId,
        templateId,
        typeCourrier,
        contenuGenere
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier-detail'] });
      toast.success("Courrier généré avec succès");
    },
    onError: (error) => {
      console.error('Error generating courrier:', error);
      toast.error("Erreur lors de la génération du courrier");
    },
  });

  return {
    generateCourrier: generateCourrierMutation.mutate,
    isGenerating: generateCourrierMutation.isPending,
  };
};