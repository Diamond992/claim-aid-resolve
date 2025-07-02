
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Shield, User, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `);

      if (error) throw error;
      setUsers(data || []);
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

    setIsInviting(true);
    try {
      const { data, error } = await supabase.rpc('generate_admin_invite', {
        admin_email: inviteEmail
      });

      if (error) throw error;

      const inviteUrl = `${window.location.origin}/admin/register?code=${data}`;
      
      // Log the admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'ADMIN_INVITE_CREATED',
        action_details: { email: inviteEmail, invite_code: data }
      });

      toast.success(`Invitation créée ! Partagez ce lien : ${inviteUrl}`);
      setInviteEmail("");
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error("Erreur lors de la création de l'invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handlePromoteUser = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'USER_ROLE_CHANGED',
        target_user: userId,
        action_details: { from_role: currentRole, to_role: newRole }
      });

      toast.success(`Utilisateur ${newRole === 'admin' ? 'promu' : 'rétrogradé'} avec succès`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un Administrateur</DialogTitle>
              <DialogDescription>
                Créez une invitation pour qu'un nouvel utilisateur devienne administrateur.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
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
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={
                      user.user_roles?.[0]?.role === 'admin' 
                        ? "bg-red-500 text-white" 
                        : "bg-green-500 text-white"
                    }
                  >
                    {user.user_roles?.[0]?.role === 'admin' ? (
                      <>
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 mr-1" />
                        Utilisateur
                      </>
                    )}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePromoteUser(user.id, user.user_roles?.[0]?.role || 'user')}
                  >
                    {user.user_roles?.[0]?.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-600">
              Aucun utilisateur ne correspond à votre recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
