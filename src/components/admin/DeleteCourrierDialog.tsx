import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useAdminMutations } from "@/hooks/useAdminMutations";

interface DeleteCourrierDialogProps {
  courrierId: string;
  courrierTitle: string;
  onDelete?: () => void;
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const DeleteCourrierDialog: React.FC<DeleteCourrierDialogProps> = ({
  courrierId,
  courrierTitle,
  onDelete,
  variant = "ghost",
  size = "sm"
}) => {
  const [open, setOpen] = useState(false);
  const { deleteCourrierMutation } = useAdminMutations();

  const handleDelete = () => {
    deleteCourrierMutation.mutate(courrierId, {
      onSuccess: () => {
        setOpen(false);
        onDelete?.();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le courrier</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement ce courrier "{courrierTitle}" ?
            <br />
            <br />
            <strong>Attention :</strong> Cette action est irréversible. Seul le courrier sera supprimé, 
            le dossier associé sera conservé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCourrierMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteCourrierMutation.isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};