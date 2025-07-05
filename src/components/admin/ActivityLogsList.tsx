
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Activity, User, FileText, CreditCard, Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  user_id: string;
  dossier_id?: string;
  action: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  dossier?: {
    compagnie_assurance: string;
  };
}

const ActivityLogsList = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles!activity_logs_user_id_fkey (first_name, last_name, email),
          dossier:dossiers (compagnie_assurance)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error("Erreur lors du chargement des logs d'activité");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('dossier')) return <FileText className="h-4 w-4" />;
    if (action.includes('courrier')) return <FileText className="h-4 w-4" />;
    if (action.includes('paiement')) return <CreditCard className="h-4 w-4" />;
    if (action.includes('document')) return <FileText className="h-4 w-4" />;
    if (action.includes('echeance')) return <Calendar className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('cree')) return "bg-green-500";
    if (action.includes('modifie') || action.includes('valide')) return "bg-blue-500";
    if (action.includes('paiement')) return "bg-purple-500";
    if (action.includes('document')) return "bg-orange-500";
    return "bg-gray-500";
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'dossier_cree': 'Dossier créé',
      'dossier_statut_modifie': 'Statut dossier modifié',
      'courrier_genere': 'Courrier généré',
      'courrier_valide': 'Courrier validé',
      'paiement_cree': 'Paiement créé',
      'paiement_statut_modifie': 'Statut paiement modifié',
      'document_telecharge': 'Document téléchargé',
      'echeance_creee': 'Échéance créée'
    };
    return labels[action] || action;
  };

  const filteredLogs = logs.filter(log => {
    const userName = `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.toLowerCase();
    const userEmail = log.profiles?.email?.toLowerCase() || '';
    const companyName = log.dossier?.compagnie_assurance?.toLowerCase() || '';
    
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) || 
                         userEmail.includes(searchTerm.toLowerCase()) ||
                         companyName.includes(searchTerm.toLowerCase()) ||
                         getActionLabel(log.action).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des logs d'activité...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs d'Activité
          </CardTitle>
          <CardDescription>
            Historique de toutes les actions des utilisateurs
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par utilisateur, action ou compagnie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {getActionLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun log trouvé</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${getActionColor(log.action)} text-white`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${getActionColor(log.action)} text-white`}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {log.profiles?.first_name} {log.profiles?.last_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({log.profiles?.email})
                        </span>
                      </div>

                      {log.dossier && (
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {log.dossier.compagnie_assurance}
                          </span>
                        </div>
                      )}

                      {log.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Voir les détails
                          </summary>
                          <div className="mt-2 text-xs bg-white p-2 rounded border">
                            <pre className="whitespace-pre-wrap font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}

                      {log.ip_address && (
                        <div className="text-xs text-gray-500 mt-1">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsList;
