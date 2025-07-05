
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, User, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  dossier_id?: string;
  client_id: string;
  stripe_payment_intent_id: string;
  montant: number;
  devise: string;
  statut: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  type_facturation: 'forfait_recours' | 'abonnement_mensuel';
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  dossier?: {
    compagnie_assurance: string;
  };
}

interface PaymentCardProps {
  payment: Payment;
  onUpdateStatus?: (id: string, status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded') => void;
}

const PaymentCard = ({ payment, onUpdateStatus }: PaymentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'canceled':
        return 'bg-gray-500 text-white';
      case 'refunded':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Réussi';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'canceled':
        return 'Annulé';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'forfait_recours':
        return 'Forfait recours';
      case 'abonnement_mensuel':
        return 'Abonnement mensuel';
      default:
        return type;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {payment.montant.toFixed(2)} {payment.devise}
          </CardTitle>
          <Badge className={getStatusColor(payment.statut)}>
            {getStatusLabel(payment.statut)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Client:</span>
              <span>
                {payment.profiles?.first_name} {payment.profiles?.last_name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Type:</span>
              <span>{getTypeLabel(payment.type_facturation)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Date:</span>
              <span>
                {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {payment.dossier && (
              <div className="text-sm">
                <span className="font-medium">Assurance:</span>
                <span className="ml-2">{payment.dossier.compagnie_assurance}</span>
              </div>
            )}
            
            <div className="text-sm">
              <span className="font-medium">ID Stripe:</span>
              <span className="ml-2 font-mono text-xs">
                {payment.stripe_payment_intent_id.substring(0, 20)}...
              </span>
            </div>
            
            {payment.description && (
              <div className="text-sm">
                <span className="font-medium">Description:</span>
                <p className="text-gray-600 mt-1">{payment.description}</p>
              </div>
            )}
          </div>
        </div>

        {onUpdateStatus && payment.statut === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => onUpdateStatus(payment.id, 'succeeded')}
            >
              Marquer comme réussi
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => onUpdateStatus(payment.id, 'failed')}
            >
              Marquer comme échoué
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;
