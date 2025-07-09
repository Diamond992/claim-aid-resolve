
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface InviteUserDialogProps {
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  inviteRole: string;
  setInviteRole: (role: string) => void;
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
        <DialogTitle>Inviter un Utilisateur</DialogTitle>
        <DialogDescription>
          Créez une invitation pour qu'un nouvel utilisateur rejoigne la plateforme.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="utilisateur@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rôle</Label>
          <Select value={inviteRole} onValueChange={(value: AppRole) => setInviteRole(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Utilisateur</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={onInviteUser}
          disabled={isInviting}
          className="w-full"
        >
          {isInviting ? "Création..." : "Créer l'invitation"}
        </Button>
      </div>
    </DialogContent>
  );
};
