
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
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
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
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
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
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
      toast.success("Échéance créée avec succès");
    },
    onError: (error) => {
      console.error('Error creating echeance:', error);
      toast.error("Erreur lors de la création de l'échéance");
    },
  });

  // Delete dossier mutation
  const deleteDossierMutation = useMutation({
    mutationFn: async (dossierId: string) => {
      // First delete related data
      await supabase.from('courriers_projets').delete().eq('dossier_id', dossierId);
      await supabase.from('echeances').delete().eq('dossier_id', dossierId);
      await supabase.from('documents').delete().eq('dossier_id', dossierId);
      await supabase.from('paiements').delete().eq('dossier_id', dossierId);
      
      // Then delete the dossier
      const { error } = await supabase
        .from('dossiers')
        .delete()
        .eq('id', dossierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dossiers-minimal'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courriers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-echeances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success("Dossier supprimé avec succès");
    },
    onError: (error) => {
      console.error('Error deleting dossier:', error);
      toast.error("Erreur lors de la suppression du dossier");
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async ({ webhook_url, test_payload }: { webhook_url: string; test_payload: any }) => {
      const { data, error } = await supabase.rpc('notify_make_webhook', {
        webhook_url,
        payload_json: test_payload,
        max_retries: 1
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (success) => {
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
      if (success) {
        toast.success("Test webhook envoyé avec succès");
      } else {
        toast.error("Échec du test webhook - vérifiez les logs");
      }
    },
    onError: (error) => {
      console.error('Error testing webhook:', error);
      toast.error("Erreur lors du test du webhook");
    },
  });

  // Update dossier information
  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('dossiers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dossiers-minimal'] });
      toast.success("Dossier mis à jour avec succès");
    },
    onError: (error) => {
      console.error('Error updating dossier:', error);
      toast.error("Erreur lors de la mise à jour du dossier");
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-dossiers'] });
      toast.success("Document supprimé avec succès");
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error("Erreur lors de la suppression du document");
    },
  });

  // Delete courrier
  const deleteCourrierMutation = useMutation({
    mutationFn: async (courrierId: string) => {
      const { error } = await supabase
        .from('courriers_projets')
        .delete()
        .eq('id', courrierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courriers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-dossiers'] });
      toast.success("Courrier supprimé avec succès");
    },
    onError: (error) => {
      console.error('Error deleting courrier:', error);
      toast.error("Erreur lors de la suppression du courrier");
    },
  });

  return {
    updateCourrierMutation,
    updateEcheanceStatusMutation,
    updatePaymentStatusMutation,
    createEcheanceMutation,
    deleteDossierMutation,
    testWebhookMutation,
    updateDossierMutation,
    deleteDocumentMutation,
    deleteCourrierMutation,
  };
};
