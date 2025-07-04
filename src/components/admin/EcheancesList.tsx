
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar } from "lucide-react";
import EcheancesCard from "./EcheancesCard";

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

interface EcheancesListProps {
  echeances: Echeance[];
  onUpdateStatus: (id: string, status: 'actif' | 'traite' | 'expire') => void;
}

const EcheancesList = ({ echeances, onUpdateStatus }: EcheancesListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredEcheances = echeances.filter(echeance => {
    const clientName = `${echeance.dossier?.profiles?.first_name || ''} ${echeance.dossier?.profiles?.last_name || ''}`.toLowerCase();
    const companyName = echeance.dossier?.compagnie_assurance?.toLowerCase() || '';
    
    const matchesSearch = clientName.includes(searchTerm.toLowerCase()) || 
                         companyName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || echeance.statut === statusFilter;
    const matchesType = typeFilter === "all" || echeance.type_echeance === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Trier par urgence (échéances approchantes en premier)
  const sortedEcheances = filteredEcheances.sort((a, b) => {
    const dateA = new Date(a.date_limite);
    const dateB = new Date(b.date_limite);
    const now = new Date();
    
    // Priorité aux échéances actives et urgentes
    if (a.statut === 'actif' && b.statut !== 'actif') return -1;
    if (b.statut === 'actif' && a.statut !== 'actif') return 1;
    
    // Ensuite par proximité de la date limite
    return dateA.getTime() - dateB.getTime();
  });

  const urgentCount = echeances.filter(e => 
    e.statut === 'actif' && new Date(e.date_alerte) <= new Date()
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gestion des Échéances
              </CardTitle>
              <CardDescription>
                Suivi des délais légaux et réglementaires
              </CardDescription>
            </div>
            {urgentCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {urgentCount} échéance(s) urgente(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par client ou assurance..."
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
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="traite">Traité</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="reponse_reclamation">Réponse réclamation</SelectItem>
                <SelectItem value="delai_mediation">Délai médiation</SelectItem>
                <SelectItem value="prescription_biennale">Prescription biennale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sortedEcheances.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune échéance trouvée</p>
            </CardContent>
          </Card>
        ) : (
          sortedEcheances.map((echeance) => (
            <EcheancesCard
              key={echeance.id}
              echeance={echeance}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EcheancesList;
