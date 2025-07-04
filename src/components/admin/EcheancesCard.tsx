
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Echeance {
  id: string;
  dossier_id: string;
  type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
  date_limite: string;
  date_alerte: string;
  statut: 'actif' | 'traite' | 'expire';
  description?: string;
  notifie: boolean;
  created_at: string;
  dossier?: {
    compagnie_assurance: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface EcheancesCardProps {
  echeance: Echeance;
  onUpdateStatus: (id: string, status: 'actif' | 'traite' | 'expire') => void;
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'reponse_reclamation':
      return 'Réponse réclamation';
    case 'delai_mediation':
      return 'Délai médiation';
    case 'prescription_biennale':
      return 'Prescription biennale';
    default:
      return type;
  }
};

const getStatusColor = (statut: string) => {
  switch (statut) {
    case 'actif':
      return 'bg-orange-100 text-orange-800';
    case 'traite':
      return 'bg-green-100 text-green-800';
    case 'expire':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (statut: string) => {
  switch (statut) {
    case 'actif':
      return <Clock className="h-4 w-4" />;
    case 'traite':
      return <CheckCircle className="h-4 w-4" />;
    case 'expire':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const EcheancesCard = ({ echeance, onUpdateStatus }: EcheancesCardProps) => {
  const isUrgent = new Date(echeance.date_alerte) <= new Date() && echeance.statut === 'actif';
  const daysRemaining = Math.ceil((new Date(echeance.date_limite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={`${isUrgent ? 'border-red-500 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {getTypeLabel(echeance.type_echeance)}
            </CardTitle>
            <CardDescription>
              Client: {echeance.dossier?.profiles?.first_name} {echeance.dossier?.profiles?.last_name}
            </CardDescription>
            <CardDescription>
              Assurance: {echeance.dossier?.compagnie_assurance}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`flex items-center gap-1 ${getStatusColor(echeance.statut)}`}>
              {getStatusIcon(echeance.statut)}
              {echeance.statut}
            </Badge>
            {isUrgent && (
              <Badge className="bg-red-500 text-white flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Date limite:</span>
              <p className="font-semibold text-gray-900">
                {format(new Date(echeance.date_limite), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Date d'alerte:</span>
              <p className="text-gray-700">
                {format(new Date(echeance.date_alerte), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {daysRemaining >= 0 ? (
            <div className={`p-2 rounded text-center text-sm font-medium ${
              daysRemaining <= 7 ? 'bg-red-100 text-red-800' : 
              daysRemaining <= 15 ? 'bg-orange-100 text-orange-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {daysRemaining === 0 ? 'Échéance aujourd\'hui' : 
               daysRemaining === 1 ? '1 jour restant' : 
               `${daysRemaining} jours restants`}
            </div>
          ) : (
            <div className="p-2 rounded text-center text-sm font-medium bg-red-100 text-red-800">
              Échéance dépassée de {Math.abs(daysRemaining)} jour(s)
            </div>
          )}

          {echeance.description && (
            <div>
              <span className="font-medium text-gray-600 text-sm">Description:</span>
              <p className="text-gray-700 text-sm mt-1">{echeance.description}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {echeance.statut === 'actif' && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(echeance.id, 'traite')}
                className="flex-1"
              >
                Marquer comme traité
              </Button>
            )}
            {echeance.statut === 'traite' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(echeance.id, 'actif')}
                className="flex-1"
              >
                Réactiver
              </Button>
            )}
            {echeance.statut === 'actif' && daysRemaining < 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdateStatus(echeance.id, 'expire')}
                className="flex-1"
              >
                Marquer comme expiré
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EcheancesCard;
