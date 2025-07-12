
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

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  isDeleting: boolean;
}

export const DeleteUserDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  userName, 
  isDeleting 
}: DeleteUserDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l'utilisateur "{userName}" ? 
            Cette action est irréversible et supprimera définitivement :
            <br />
            <br />
            • Le compte d'authentification (auth)
            <br />
            • Le profil utilisateur
            <br />
            • Tous les dossiers associés
            <br />
            • Tous les documents et courriers
            <br />
            • L'historique des paiements
            <br />
            <br />
            <strong>L'email pourra être réutilisé pour créer un nouveau compte.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
