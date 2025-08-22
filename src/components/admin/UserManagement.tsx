
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
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
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
      const { data, error } = await supabase.rpc('generate_admin_invite', {
        admin_email: inviteEmail
      });

      if (error) {
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

      toast.success(`Invitation créée ! Partagez ce lien : ${inviteUrl}`, {
        duration: 10000
      });
      
      setInviteEmail("");
      setInviteRole("user");
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { data, error } = await supabase.rpc('secure_change_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        toast.error(`Erreur: ${error.message}`);
        return;
      }

      toast.success("Rôle modifié avec succès");
      await fetchUsers();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      console.log('Deleting user with secure RPC function:', userId);
      
      // Verify admin permissions before attempting deletion
      if (!isAdmin) {
        throw new Error('Unauthorized: admin role required');
      }

      // Get current user to prevent self-deletion check on client side
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === userId) {
        throw new Error('Cannot delete your own user account');
      }

      // Call the secure RPC function that handles the entire deletion process
      const { data, error } = await supabase.rpc('secure_delete_user', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error from secure_delete_user RPC:', error);
        throw error;
      }

      if (data !== true) {
        throw new Error('User deletion failed - RPC returned false');
      }

      console.log('User successfully deleted via secure RPC function');
      toast.success("Utilisateur supprimé avec succès");
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Erreur lors de la suppression de l'utilisateur";
      
      if (error.message?.includes('Cannot delete your own')) {
        errorMessage = "Vous ne pouvez pas supprimer votre propre compte";
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = "Permissions insuffisantes pour cette action";
      } else if (error.message?.includes('User not found')) {
        errorMessage = "Utilisateur introuvable";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setDeletingUserId(null);
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
        onDeleteUser={handleDeleteUser}
        deletingUserId={deletingUserId}
      />
    </div>
  );
};

export default UserManagement;
