
import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";
import CourrierCard from "./CourrierCard";

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

interface CourriersListProps {
  courriers: CourierData[];
  isLoading: boolean;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
  onDelete?: (id: string) => void;
}

const CourriersList = ({ courriers, isLoading, onValidate, onReject, onDelete }: CourriersListProps) => {
  if (isLoading) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement...</h3>
          <p className="text-gray-600">
            Chargement des courriers en cours...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (courriers.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun courrier trouvé</h3>
          <p className="text-gray-600">
            Aucun courrier IA ne correspond à vos critères de recherche.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Courriers IA ({courriers.length})</h3>
      
      {courriers.map((courrier) => (
        <CourrierCard
          key={courrier.id}
          courrier={courrier}
          onValidate={onValidate}
          onReject={onReject}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CourriersList;
