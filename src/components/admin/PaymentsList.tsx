
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard } from "lucide-react";
import PaymentCard from "./PaymentCard";

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

interface PaymentsListProps {
  payments: Payment[];
  isLoading: boolean;
  onStatusUpdate: (id: string, status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded') => void;
}

const PaymentsList = ({ payments, isLoading, onStatusUpdate }: PaymentsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des paiements...</p>
        </CardContent>
      </Card>
    );
  }

  const filteredPayments = payments.filter(payment => {
    const clientName = `${payment.profiles?.first_name || ''} ${payment.profiles?.last_name || ''}`.toLowerCase();
    const clientEmail = payment.profiles?.email?.toLowerCase() || '';
    const companyName = payment.dossier?.compagnie_assurance?.toLowerCase() || '';
    
    const matchesSearch = clientName.includes(searchTerm.toLowerCase()) || 
                         clientEmail.includes(searchTerm.toLowerCase()) ||
                         companyName.includes(searchTerm.toLowerCase()) ||
                         payment.stripe_payment_intent_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.statut === statusFilter;
    const matchesType = typeFilter === "all" || payment.type_facturation === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Trier par date de création (plus récents en premier)
  const sortedPayments = filteredPayments.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalAmount = filteredPayments
    .filter(p => p.statut === 'succeeded')
    .reduce((sum, payment) => sum + payment.montant, 0);

  const pendingCount = payments.filter(p => p.statut === 'pending').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gestion des Paiements
              </CardTitle>
              <CardDescription>
                Suivi des paiements et facturation Stripe
              </CardDescription>
            </div>
            <div className="flex gap-4">
              {pendingCount > 0 && (
                <Badge className="bg-yellow-500 text-white">
                  {pendingCount} paiement(s) en attente
                </Badge>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-600">Total encaissé</p>
                <p className="text-lg font-bold text-green-600">
                  {totalAmount.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par client, email ou ID Stripe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="succeeded">Réussi</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="canceled">Annulé</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="forfait_recours">Forfait recours</SelectItem>
                <SelectItem value="abonnement_mensuel">Abonnement mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sortedPayments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun paiement trouvé</p>
            </CardContent>
          </Card>
        ) : (
          sortedPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onUpdateStatus={onStatusUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentsList;
