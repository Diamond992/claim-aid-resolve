
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Database } from "@/integrations/supabase/types";
import { UserManagementHeader } from "./user-management/UserManagementHeader";
import { UserSearchCard } from "./user-management/UserSearchCard";
import { UsersList } from "./user-management/UsersList";

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

      await supabase.rpc('log_admin_action', {
        action_type: 'USER_ROLE_CHANGED',
        target_user: userId,
        action_details: { new_role: newRole }
      });

      toast.success(`Rôle utilisateur mis à jour avec succès`);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.message || "Erreur lors de la modification du rôle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserManagementHeader
        isAdmin={isAdmin}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        isInviting={isInviting}
        onInviteUser={handleInviteAdmin}
      />

      <UserSearchCard
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <UsersList
        users={users}
        searchTerm={searchTerm}
        isAdmin={isAdmin}
        onChangeUserRole={handleChangeUserRole}
      />
    </div>
  );
};

export default UserManagement;
