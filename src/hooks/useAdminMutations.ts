
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdminMutations = () => {
  const queryClient = useQueryClient();

  // Update courrier status mutation
  const updateCourrierMutation = useMutation({
    mutationFn: async ({ id, statut, admin_validateur }: { 
      id: string; 
      statut: string; 
      admin_validateur?: string;
    }) => {
      const updateData: any = { 
        statut,
        updated_at: new Date().toISOString()
      };
      
      if (statut === 'valide_pret_envoi' || statut === 'modifie_pret_envoi') {
        updateData.admin_validateur = admin_validateur;
        updateData.date_validation = new Date().toISOString();
      }

      const { error } = await supabase
        .from('courriers_projets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courriers'] });
      toast.success("Statut du courrier mis à jour");
    },
    onError: (error) => {
      console.error('Error updating courrier:', error);
      toast.error("Erreur lors de la mise à jour du courrier");
    },
  });

  // Update echeance status mutation
  const updateEcheanceStatusMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: 'actif' | 'traite' | 'expire' }) => {
      const { error } = await supabase
        .from('echeances')
        .update({ 
          statut,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-echeances'] });
      toast.success("Statut de l'échéance mis à jour");
    },
    onError: (error) => {
      console.error('Error updating echeance:', error);
      toast.error("Erreur lors de la mise à jour de l'échéance");
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded' }) => {
      const { error } = await supabase
        .from('paiements')
        .update({ 
          statut,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success("Statut du paiement mis à jour");
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error("Erreur lors de la mise à jour du paiement");
    },
  });

  // Create echeance mutation
  const createEcheanceMutation = useMutation({
    mutationFn: async (echeanceData: {
      dossier_id: string;
      type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
      date_limite: string;
      description?: string;
    }) => {
      const { error } = await supabase
        .from('echeances')
        .insert([echeanceData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-echeances'] });
      toast.success("Échéance créée avec succès");
    },
    onError: (error) => {
      console.error('Error creating echeance:', error);
      toast.error("Erreur lors de la création de l'échéance");
    },
  });

  return {
    updateCourrierMutation,
    updateEcheanceStatusMutation,
    updatePaymentStatusMutation,
    createEcheanceMutation,
  };
};
