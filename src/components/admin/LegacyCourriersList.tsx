
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CourierData {
  id: string;
  dossier_id: string;
  type_courrier: string;
  contenu_genere: string;
  contenu_final?: string;
  statut: string;
  admin_validateur?: string;
  numero_suivi?: string;
  cout_envoi?: number;
  reference_laposte?: string;
  date_creation: string;
  date_validation?: string;
  date_envoi?: string;
  dossier: {
    client_id: string;
    compagnie_assurance: string;
    type_sinistre: string;
    montant_refuse: number;
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface LegacyCourriersListProps {
  courriers: CourierData[];
  onValidate: (id: string) => void;
}

const LegacyCourriersList = ({ courriers, onValidate }: LegacyCourriersListProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente_validation": return "bg-orange-500";
      case "valide_pret_envoi": return "bg-blue-500";
      case "modifie_pret_envoi": return "bg-purple-500";
      case "envoye": return "bg-green-500";
      case "rejete": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "en_attente_validation": return "En attente de validation";
      case "valide_pret_envoi": return "Validé - Prêt à envoyer";
      case "modifie_pret_envoi": return "Modifié - Prêt à envoyer";
      case "envoye": return "Envoyé";
      case "rejete": return "Rejeté";
      default: return status;
    }
  };

  if (courriers.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun dossier trouvé</h3>
          <p className="text-gray-600">
            Aucun dossier ne correspond à vos critères de recherche.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Dossiers Clients ({courriers.length})</h3>
      
      {courriers.map((courrier) => (
        <Card key={courrier.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CardTitle className="text-lg">#{courrier.id} - {courrier.dossier?.compagnie_assurance}</CardTitle>
                  <Badge className={`${getStatusColor(courrier.statut)} text-white`}>
                    {getStatusLabel(courrier.statut)}
                  </Badge>
                </div>
                <CardDescription>
                  <strong>Client:</strong> {courrier.dossier?.profiles?.first_name} {courrier.dossier?.profiles?.last_name} ({courrier.dossier?.profiles?.email}) • 
                  <strong> Type:</strong> {courrier.dossier?.type_sinistre} • 
                  <strong> Créé:</strong> {new Date(courrier.date_creation).toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{courrier.contenu_genere}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Montant réclamé:</span>
                <div className="font-semibold text-emerald-600">{courrier.dossier?.montant_refuse}€</div>
              </div>
              <div>
                <span className="text-gray-500">Documents:</span>
                <div className="font-semibold">5 fichiers</div>
              </div>
              <div>
                <span className="text-gray-500">Courrier IA:</span>
                <div className={`font-semibold text-emerald-600`}>
                  Généré
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/admin/case/${courrier.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir Détails
              </Button>
              
              {courrier.statut === "en_attente_validation" && (
                <>
                  <Button 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onValidate(courrier.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider Courrier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/admin/case/${courrier.id}/messages`)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Demander Modification
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/admin/case/${courrier.id}/messages`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LegacyCourriersList;
