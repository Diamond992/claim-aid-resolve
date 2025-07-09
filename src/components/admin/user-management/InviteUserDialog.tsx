
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface InviteUserDialogProps {
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  inviteRole: AppRole;
  setInviteRole: (role: AppRole) => void;
  isInviting: boolean;
  onInviteUser: () => void;
}

export const InviteUserDialog = ({
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  isInviting,
  onInviteUser
}: InviteUserDialogProps) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Inviter un Nouvel Utilisateur</DialogTitle>
        <DialogDescription>
          Créez une invitation pour un nouvel utilisateur avec un rôle spécifique.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="email@exemple.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="invite-role">Rôle</Label>
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Utilisateur</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={onInviteUser}
          disabled={isInviting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isInviting ? "Création..." : "Créer l'invitation"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
