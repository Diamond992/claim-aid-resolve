import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminDossiersListProps {
  dossiers: any[];
  isLoading: boolean;
  onViewDossier: (dossierId: string) => void;
  onEditDossier: (dossierId: string) => void;
  onDeleteDossier: (dossierId: string) => void;
}

const STATUT_COLORS = {
  nouveau: "bg-blue-100 text-blue-800",
  en_cours: "bg-yellow-100 text-yellow-800",
  en_attente: "bg-orange-100 text-orange-800",
  termine: "bg-green-100 text-green-800",
  rejete: "bg-red-100 text-red-800",
};

const AdminDossiersList = ({ 
  dossiers, 
  isLoading, 
  onViewDossier,
  onEditDossier,
  onDeleteDossier 
}: AdminDossiersListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // Filter dossiers based on search and filters
  const filteredDossiers = dossiers.filter(dossier => {
    const matchesSearch = 
      dossier.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.compagnie_assurance?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.police_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || dossier.statut === statusFilter;
    const matchesCompany = companyFilter === "all" || dossier.compagnie_assurance === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  // Get unique companies for filter
  const companies = [...new Set(dossiers.map(d => d.compagnie_assurance))].filter(Boolean);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, compagnie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
              </SelectContent>
            </Select>

            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Compagnie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les compagnies</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredDossiers.length} dossier(s) trouvé(s)
      </div>

      {/* Dossiers list */}
      <div className="space-y-4">
        {filteredDossiers.map(dossier => (
          <Card key={dossier.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">
                      {dossier.profiles?.first_name} {dossier.profiles?.last_name}
                    </h3>
                    <Badge className={STATUT_COLORS[dossier.statut as keyof typeof STATUT_COLORS]}>
                      {dossier.statut}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>
                      <div className="text-muted-foreground">{dossier.profiles?.email}</div>
                    </div>
                    <div>
                      <span className="font-medium">Compagnie:</span>
                      <div className="text-muted-foreground">{dossier.compagnie_assurance}</div>
                    </div>
                    <div>
                      <span className="font-medium">Type sinistre:</span>
                      <div className="text-muted-foreground">{dossier.type_sinistre}</div>
                    </div>
                    <div>
                      <span className="font-medium">Montant refusé:</span>
                      <div className="text-muted-foreground">{dossier.montant_refuse}€</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Police:</span>
                      <div className="text-muted-foreground">{dossier.police_number}</div>
                    </div>
                    <div>
                      <span className="font-medium">Date sinistre:</span>
                      <div className="text-muted-foreground">
                        {format(new Date(dossier.date_sinistre), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Créé le:</span>
                      <div className="text-muted-foreground">
                        {format(new Date(dossier.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{dossier.documents?.length || 0} document(s)</span>
                    <span>{dossier.courriers?.length || 0} courrier(s)</span>
                    <span>{dossier.echeances?.length || 0} échéance(s)</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDossier(dossier.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditDossier(dossier.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteDossier(dossier.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDossiers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Aucun dossier trouvé</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDossiersList;