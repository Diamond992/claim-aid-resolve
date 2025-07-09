
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Shield, Trash2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { DeleteUserDialog } from "./DeleteUserDialog";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  role: AppRole | null;
}

interface UserCardProps {
  user: UserWithRole;
  isAdmin: boolean;
  onChangeUserRole: (userId: string, newRole: AppRole) => void;
  onDeleteUser: (userId: string) => void;
  isDeleting?: boolean;
}

export const UserCard = ({ 
  user, 
  isAdmin, 
  onChangeUserRole, 
  onDeleteUser,
  isDeleting = false 
}: UserCardProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getRoleBadgeVariant = (role: AppRole | null) => {
    switch (role) {
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: AppRole | null) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: AppRole | null) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'user':
        return 'Utilisateur';
      default:
        return 'Aucun rôle';
    }
  };

  const handleDeleteConfirm = () => {
    onDeleteUser(user.id);
    setDeleteDialogOpen(false);
  };

  const userName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.email || 'Utilisateur sans nom';

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {userName}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email || 'Email non disponible'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={getRoleBadgeVariant(user.role)}
                className="flex items-center gap-1"
              >
                {getRoleIcon(user.role)}
                {getRoleLabel(user.role)}
              </Badge>
              {isAdmin && (
                <>
                  <Select 
                    value={user.role || 'user'}
                    onValueChange={(newRole: AppRole) => onChangeUserRole(user.id, newRole)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        userName={userName}
        isDeleting={isDeleting}
      />
    </>
  );
};
