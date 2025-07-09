
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Shield, User, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
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

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("user");
  const [isInviting, setIsInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users with explicit join...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at,
          updated_at,
          user_roles!fk_user_roles_user_id (
            role
          )
        `);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data);

      // Transform the data to flatten the role
      const transformedUsers: UserWithRole[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at,
        role: user.user_roles?.[0]?.role || null
      }));

      console.log('Transformed users:', transformedUsers);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteAdmin = async () => {
    if (!inviteEmail) {
      toast.error("Veuillez saisir un email");
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error("Veuillez saisir un email valide");
      return;
    }

    setIsInviting(true);
    try {
      console.log('Creating admin invitation for:', inviteEmail);
      
      const { data, error } = await supabase.rpc('generate_admin_invite', {
        admin_email: inviteEmail
      });

      if (error) {
        console.error('Error creating invite:', error);
        throw error;
      }

      const inviteUrl = `${window.location.origin}/admin/register?code=${data}`;
      
      // Log the admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'ADMIN_INVITE_CREATED',
        action_details: { 
          email: inviteEmail, 
          invite_code: data, 
          role: inviteRole 
        }
      });

      console.log('Invitation created successfully:', inviteUrl);
      toast.success(`Invitation créée ! Partagez ce lien : ${inviteUrl}`, {
        duration: 10000
      });
      
      setInviteEmail("");
      setInviteRole("user");
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating invite:', error);
      toast.error(error.message || "Erreur lors de la création de l'invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: AppRole) => {
    try {
      console.log('Changing user role:', { userId, newRole });
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole 
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      // Log the admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'USER_ROLE_CHANGED',
        target_user: userId,
        action_details: { new_role: newRole }
      });

      toast.success(`Rôle utilisateur mis à jour avec succès`);
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.message || "Erreur lors de la modification du rôle");
    }
  };

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

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                  onClick={handleInviteAdmin}
                  disabled={isInviting}
                  className="w-full"
                >
                  {isInviting ? "Création..." : "Créer l'invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher</CardTitle>
          <CardDescription>
            Trouvez un utilisateur par nom ou email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              {searchTerm ? "Aucun utilisateur trouvé pour cette recherche" : "Aucun utilisateur trouvé"}
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
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
                        onValueChange={(newRole: AppRole) => handleChangeUserRole(user.id, newRole)}
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
          ))
        )}
      </div>
    </div>
  );
};

export default UserManagement;
