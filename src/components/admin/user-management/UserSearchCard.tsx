
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserSearchCardProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const UserSearchCard = ({ searchTerm, setSearchTerm }: UserSearchCardProps) => {
  return (
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
  );
};
