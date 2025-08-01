import { useParams, useNavigate } from "react-router-dom";
import { useDossierDetail } from "@/hooks/useDossierDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Mail, Calendar, AlertTriangle, Upload, Edit, MessageCircle } from "lucide-react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { EditDossier } from "@/components/EditDossier";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DossierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDossierDetail(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Dossier introuvable</h2>
            <p className="text-muted-foreground mb-4">
              Ce dossier n'existe pas ou vous n'avez pas l'autorisation de le consulter.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { dossier, documents, courriers, echeances } = data;

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'nouveau': return 'secondary';
      case 'en_cours': return 'default';
      case 'valide': return 'default';
      case 'cloture': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeSinistreLabel = (type: string) => {
    switch (type) {
      case 'automobile': return 'Automobile';
      case 'habitation': return 'Habitation';
      case 'sante': return 'Santé';
      case 'professionnelle': return 'Professionnelle';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Détails du dossier</h1>
          <Badge variant={getStatutBadgeVariant(dossier.statut)}>
            {dossier.statut.replace('_', ' ')}
          </Badge>
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-4 mb-8">
          <EditDossier dossier={dossier} onUpdateSuccess={refetch} />
          <Button 
            variant="outline" 
            onClick={() => navigate(`/case/${id}/messages`)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Messages
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dossier Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations du sinistre
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type de sinistre</label>
                  <p className="font-medium">{getTypeSinistreLabel(dossier.type_sinistre)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date du sinistre</label>
                  <p className="font-medium">
                    {format(new Date(dossier.date_sinistre), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Compagnie d'assurance</label>
                  <p className="font-medium">{dossier.compagnie_assurance}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">N° de police</label>
                  <p className="font-medium">{dossier.police_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Montant refusé</label>
                  <p className="font-medium">{dossier.montant_refuse.toLocaleString()} €</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de refus</label>
                  <p className="font-medium">
                    {format(new Date(dossier.refus_date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                {dossier.motif_refus && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Motif du refus</label>
                    <p className="font-medium">{dossier.motif_refus}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground">Aucun document uploadé</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{doc.nom_fichier}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.type_document} • {(doc.taille_fichier / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload de documents */}
            <DocumentUpload dossierId={id || ''} onUploadSuccess={refetch} />
            {/* Messages/Courriers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Courriers ({courriers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courriers.length === 0 ? (
                  <p className="text-muted-foreground">Aucun courrier généré</p>
                ) : (
                  <div className="space-y-3">
                    {courriers.slice(0, 3).map((courrier) => (
                      <div key={courrier.id} className="p-3 border rounded-lg">
                        <p className="font-medium text-sm">{courrier.type_courrier}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(courrier.date_creation), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {courrier.statut}
                        </Badge>
                      </div>
                    ))}
                    {courriers.length > 3 && (
                      <Button variant="outline" size="sm" className="w-full">
                        Voir tous les courriers
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Échéances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Échéances ({echeances.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {echeances.length === 0 ? (
                  <p className="text-muted-foreground">Aucune échéance</p>
                ) : (
                  <div className="space-y-3">
                    {echeances.slice(0, 3).map((echeance) => (
                      <div key={echeance.id} className="p-3 border rounded-lg">
                        <p className="font-medium text-sm">{echeance.type_echeance}</p>
                        <p className="text-xs text-muted-foreground">
                          Limite: {format(new Date(echeance.date_limite), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                        <Badge variant={echeance.statut === 'actif' ? 'default' : 'secondary'} className="mt-1 text-xs">
                          {echeance.statut}
                        </Badge>
                      </div>
                    ))}
                    {echeances.length > 3 && (
                      <Button variant="outline" size="sm" className="w-full">
                        Voir toutes les échéances
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DossierDetail;