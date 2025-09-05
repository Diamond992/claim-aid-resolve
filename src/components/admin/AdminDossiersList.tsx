import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Edit, Trash2, FileText, ChevronDown, Eye, Download, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface AdminDossiersListProps {
  dossiers: any[];
  isLoading: boolean;
  onEditDossier: (dossierId: string) => void;
  onDeleteDossier: (dossierId: string) => void;
  onGenerateCourrier: (dossierId: string) => void;
  onDeleteDocument?: (documentId: string) => void;
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
  onEditDossier,
  onDeleteDossier,
  onGenerateCourrier,
  onDeleteDocument 
}: AdminDossiersListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<string>("desc");
  const [expandedDossiers, setExpandedDossiers] = useState<Set<string>>(new Set());

  // Filter and sort dossiers
  const filteredDossiers = dossiers
    .filter(dossier => {
      const matchesSearch = 
        dossier.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.compagnie_assurance?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.police_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || dossier.statut === statusFilter;
      const matchesCompany = companyFilter === "all" || dossier.compagnie_assurance === companyFilter;
      const matchesUser = userFilter === "all" || 
        `${dossier.profiles?.first_name} ${dossier.profiles?.last_name}`.toLowerCase().includes(userFilter.toLowerCase()) ||
        dossier.profiles?.email?.toLowerCase().includes(userFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCompany && matchesUser;
    })
    .sort((a, b) => {
      if (dateSort === "desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

  // Get unique companies and users for filters
  const companies = [...new Set(dossiers.map(d => d.compagnie_assurance))].filter(Boolean);
  const users = [...new Set(dossiers.map(d => 
    d.profiles ? `${d.profiles.first_name} ${d.profiles.last_name}` : null
  ))].filter(Boolean);

  // Utility functions for document handling
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFilePathFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/storage/v1/object/public/documents/')[1];
    } catch {
      return url;
    }
  };

  const handleSecureDocumentView = async (document: any) => {
    try {
      const filePath = getFilePathFromUrl(document.url_stockage);
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du document:', error);
    }
  };

  const handleSecureDocumentDownload = async (document: any) => {
    try {
      const filePath = getFilePathFromUrl(document.url_stockage);
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = document.nom_fichier;
        a.click();
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const toggleDossierExpansion = (dossierId: string) => {
    const newExpanded = new Set(expandedDossiers);
    if (newExpanded.has(dossierId)) {
      newExpanded.delete(dossierId);
    } else {
      newExpanded.add(dossierId);
    }
    setExpandedDossiers(newExpanded);
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      'contrat_assurance': 'Contrat d\'assurance',
      'expertise': 'Expertise',
      'facture': 'Facture',
      'devis': 'Devis',
      'courrier_assurance': 'Courrier assurance',
      'piece_identite': 'Pièce d\'identité',
      'justificatif_domicile': 'Justificatif de domicile',
      'autre': 'Autre'
    };
    return labels[type as keyof typeof labels] || type;
  };

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {users.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateSort} onValueChange={setDateSort}>
              <SelectTrigger>
                <SelectValue placeholder="Tri par date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Plus récent d'abord</SelectItem>
                <SelectItem value="asc">Plus ancien d'abord</SelectItem>
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
            <Collapsible
              open={expandedDossiers.has(dossier.id)}
              onOpenChange={() => toggleDossierExpansion(dossier.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1 h-auto">
                          <ChevronDown className={`h-4 w-4 transition-transform ${
                            expandedDossiers.has(dossier.id) ? 'rotate-180' : ''
                          }`} />
                        </Button>
                      </CollapsibleTrigger>
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
                         <div className="text-muted-foreground">{dossier.type_sinistre || 'N/A'}</div>
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
                      onClick={() => onGenerateCourrier(dossier.id)}
                      title="Générer un courrier"
                    >
                      <FileText className="h-4 w-4" />
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

                {/* Collapsible Documents Section */}
                <CollapsibleContent className="mt-6">
                  {dossier.documents && dossier.documents.length > 0 ? (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents ({dossier.documents.length})
                      </h4>
                      <div className="grid gap-3">
                        {dossier.documents
                          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((document: any) => (
                          <div key={document.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium text-sm truncate">
                                  {document.nom_fichier}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {getDocumentTypeLabel(document.type_document)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(document.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                </span>
                                <span>{formatFileSize(document.taille_fichier)}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSecureDocumentView(document)}
                                title="Voir le document"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSecureDocumentDownload(document)}
                                title="Télécharger"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              {onDeleteDocument && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onDeleteDocument(document.id)}
                                  className="text-destructive hover:text-destructive"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4">
                      <p className="text-muted-foreground text-sm text-center py-4">
                        Aucun document disponible pour ce dossier
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
              </CardContent>
            </Collapsible>
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