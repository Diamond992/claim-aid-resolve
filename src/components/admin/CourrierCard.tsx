
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Eye, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeleteDossierDialog } from "@/components/admin/DeleteDossierDialog";

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

interface CourrierCardProps {
  courrier: CourierData;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

const CourrierCard = ({ courrier, onValidate, onReject }: CourrierCardProps) => {
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

  const getTypeCourrierLabel = (type: string) => {
    switch (type) {
      case "reclamation_interne": return "Réclamation interne";
      case "mediation": return "Médiation";
      case "mise_en_demeure": return "Mise en demeure";
      default: return type;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <CardTitle className="text-lg">
                <Bot className="inline h-5 w-5 mr-2" />
                {getTypeCourrierLabel(courrier.type_courrier)}
              </CardTitle>
              <Badge className={`${getStatusColor(courrier.statut)} text-white`}>
                {getStatusLabel(courrier.statut)}
              </Badge>
            </div>
            <CardDescription>
              <strong>Client:</strong> {courrier.dossier?.profiles?.first_name} {courrier.dossier?.profiles?.last_name} ({courrier.dossier?.profiles?.email}) • 
              <strong> Compagnie:</strong> {courrier.dossier?.compagnie_assurance} • 
              <strong> Type:</strong> {courrier.dossier?.type_sinistre || 'N/A'} • 
              <strong> Créé:</strong> {new Date(courrier.date_creation).toLocaleDateString('fr-FR')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Contenu généré par IA:</h4>
          <p className="text-sm text-gray-600 line-clamp-3">{courrier.contenu_genere}</p>
        </div>
        
        {courrier.contenu_final && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Contenu final:</h4>
            <p className="text-sm text-gray-600 line-clamp-3">{courrier.contenu_final}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Montant réclamé:</span>
            <div className="font-semibold text-emerald-600">{courrier.dossier?.montant_refuse}€</div>
          </div>
          {courrier.numero_suivi && (
            <div>
              <span className="text-gray-500">N° de suivi:</span>
              <div className="font-semibold">{courrier.numero_suivi}</div>
            </div>
          )}
          {courrier.cout_envoi && (
            <div>
              <span className="text-gray-500">Coût d'envoi:</span>
              <div className="font-semibold">{courrier.cout_envoi}€</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/admin/courrier/${courrier.id}`)}
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
                Valider
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => onReject(courrier.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </>
          )}
          
          <DeleteDossierDialog
            dossierId={courrier.dossier_id}
            dossierTitle={`${courrier.dossier?.profiles?.first_name} ${courrier.dossier?.profiles?.last_name} - ${courrier.dossier?.compagnie_assurance}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CourrierCard;
