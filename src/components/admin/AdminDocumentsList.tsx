import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Trash2, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminDocumentsListProps {
  dossiers: any[];
  isLoading: boolean;
  onDeleteDocument: (documentId: string) => void;
  onViewDocument: (documentUrl: string) => void;
}

const DOCUMENT_TYPE_LABELS = {
  refus_assurance: "Courrier de refus",
  police: "Police d'assurance",
  facture: "Facture",
  expertise: "Rapport d'expertise",
  autre: "Autre"
};

const AdminDocumentsList = ({ 
  dossiers, 
  isLoading, 
  onDeleteDocument,
  onViewDocument 
}: AdminDocumentsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Extract all documents from all dossiers
  const allDocuments = dossiers.flatMap(dossier => 
    (dossier.documents || []).map((doc: any) => ({
      ...doc,
      dossier_info: {
        id: dossier.id,
        client_name: `${dossier.profiles?.first_name} ${dossier.profiles?.last_name}`,
        compagnie_assurance: dossier.compagnie_assurance,
        statut: dossier.statut
      }
    }))
  );

  // Filter documents
  const filteredDocuments = allDocuments.filter(doc => {
    const matchesSearch = 
      doc.nom_fichier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.dossier_info.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.dossier_info.compagnie_assurance?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || doc.type_document === typeFilter;

    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom de fichier, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredDocuments.length} document(s) trouvé(s)
      </div>

      {/* Documents list */}
      <div className="space-y-4">
        {filteredDocuments.map(doc => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{doc.nom_fichier}</h3>
                    <Badge variant="outline">
                      {DOCUMENT_TYPE_LABELS[doc.type_document as keyof typeof DOCUMENT_TYPE_LABELS]}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Client:</span>
                      <div className="text-muted-foreground">{doc.dossier_info.client_name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Compagnie:</span>
                      <div className="text-muted-foreground">{doc.dossier_info.compagnie_assurance}</div>
                    </div>
                    <div>
                      <span className="font-medium">Taille:</span>
                      <div className="text-muted-foreground">{formatFileSize(doc.taille_fichier)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Ajouté le:</span>
                      <div className="text-muted-foreground">
                        {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Type MIME: {doc.mime_type}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDocument(doc.url_stockage)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.url_stockage, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteDocument(doc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Aucun document trouvé</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDocumentsList;