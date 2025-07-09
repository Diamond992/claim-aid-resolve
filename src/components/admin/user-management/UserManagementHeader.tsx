
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { InviteUserDialog } from "./InviteUserDialog";

interface UserManagementHeaderProps {
  isAdmin: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  inviteRole: string;
  setInviteRole: (role: string) => void;
  isInviting: boolean;
  onInviteUser: () => void;
}

export const UserManagementHeader = ({
  isAdmin,
  dialogOpen,
  setDialogOpen,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  isInviting,
  onInviteUser
}: UserManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un Utilisateur
            </Button>
          </DialogTrigger>
          <InviteUserDialog
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            isInviting={isInviting}
            onInviteUser={onInviteUser}
          />
        </Dialog>
      )}
    </div>
  );
};
