
import { Card, CardContent } from "@/components/ui/card";
import { UserCard } from "./UserCard";
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

interface UsersListProps {
  users: UserWithRole[];
  searchTerm: string;
  isAdmin: boolean;
  onChangeUserRole: (userId: string, newRole: AppRole) => void;
}

export const UsersList = ({ users, searchTerm, isAdmin, onChangeUserRole }: UsersListProps) => {
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (filteredUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          {searchTerm ? "Aucun utilisateur trouvé pour cette recherche" : "Aucun utilisateur trouvé"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredUsers.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          isAdmin={isAdmin}
          onChangeUserRole={onChangeUserRole}
        />
      ))}
    </div>
  );
};
