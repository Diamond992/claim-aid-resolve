
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Shield } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

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
}

export const UserCard = ({ user, isAdmin, onChangeUserRole }: UserCardProps) => {
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user.email || 'Utilisateur sans nom'
                }
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
