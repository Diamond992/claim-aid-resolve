
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, Mail, Shield, Trash2, ChevronDown, ChevronRight, FolderOpen, FileText, Calendar, AlertCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { useUserDossiers } from "@/hooks/useUserDossiers";

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
  const [dossiersExpanded, setDossiersExpanded] = useState(false);
  const { data: dossiers = [], isLoading: dossiersLoading } = useUserDossiers(user.id);

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

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'nouveau':
        return 'default';
      case 'en_cours':
        return 'secondary';
      case 'termine':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const dossiersStats = {
    total: dossiers.length,
    actifs: dossiers.filter(d => d.statut === 'en_cours').length,
    nouveaux: dossiers.filter(d => d.statut === 'nouveau').length,
    documentsTotal: dossiers.reduce((acc, d) => acc + (d.documents?.length || 0), 0),
    echéancesUrgentes: dossiers.reduce((acc, d) => {
      const urgentes = d.echeances?.filter(e => 
        e.statut === 'actif' && 
        new Date(e.date_limite) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
      return acc + urgentes;
    }, 0)
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {userName}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email || 'Email non disponible'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {dossiersStats.total} dossier{dossiersStats.total !== 1 ? 's' : ''}
                  </Badge>
                  {dossiersStats.echéancesUrgentes > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {dossiersStats.echéancesUrgentes} urgente{dossiersStats.echéancesUrgentes !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
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
              {dossiersStats.total > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDossiersExpanded(!dossiersExpanded)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {dossiersExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
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
                    className="text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {dossiersStats.total > 0 && (
            <Collapsible open={dossiersExpanded} onOpenChange={setDossiersExpanded}>
              <CollapsibleContent className="mt-4 pt-4 border-t">
                {dossiersLoading ? (
                  <div className="text-sm text-muted-foreground">Chargement des dossiers...</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {dossiersStats.documentsTotal} documents
                      </span>
                      <span>Nouveaux: {dossiersStats.nouveaux}</span>
                      <span>En cours: {dossiersStats.actifs}</span>
                    </div>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {dossiers.map((dossier) => (
                        <div key={dossier.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {dossier.compagnie_assurance}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dossier.type_sinistre} • {new Date(dossier.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant={getStatutBadgeVariant(dossier.statut)} className="text-xs">
                              {dossier.statut}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => window.open(`/dossier/${dossier.id}`, '_blank')}
                            >
                              Voir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
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
