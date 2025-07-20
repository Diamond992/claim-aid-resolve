import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteDossierDialogProps {
  dossierId: string;
  dossierTitle: string;
  onDelete?: () => void;
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const DeleteDossierDialog = ({ 
  dossierId, 
  dossierTitle, 
  onDelete,
  variant = "ghost",
  size = "sm"
}: DeleteDossierDialogProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dossiers-minimal'] });
      toast.success("Dossier supprimé avec succès");
      setOpen(false);
      onDelete?.();
    },
    onError: (error) => {
      console.error('Error deleting dossier:', error);
      toast.error("Erreur lors de la suppression du dossier");
    },
  });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        {size !== "sm" && <span className="ml-2">Supprimer</span>}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le dossier "{dossierTitle}" ?
              Cette action est irréversible et supprimera également tous les courriers,
              échéances, documents et paiements associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};