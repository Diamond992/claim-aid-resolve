
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
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ActivityLogsList = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error("Erreur lors du chargement des logs d'activité");
    } finally {
      setIsLoading(false);
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'dossiers':
        return <FileText className="h-4 w-4" />;
      case 'courriers_projets':
        return <FileText className="h-4 w-4" />;
      case 'paiements':
        return <CreditCard className="h-4 w-4" />;
      case 'documents':
        return <FileText className="h-4 w-4" />;
      case 'echeances':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return "bg-green-500";
      case 'UPDATE':
        return "bg-blue-500";
      case 'DELETE':
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: { [key: string]: string } = {
      'dossiers': 'Dossiers',
      'courriers_projets': 'Courriers',
      'paiements': 'Paiements',
      'documents': 'Documents',
      'echeances': 'Échéances'
    };
    return labels[tableName] || tableName;
  };

  const filteredLogs = logs.filter(log => {
    const userName = `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.toLowerCase();
    const userEmail = log.profiles?.email?.toLowerCase() || '';
    const tableName = getTableLabel(log.table_name).toLowerCase();
    
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) || 
                         userEmail.includes(searchTerm.toLowerCase()) ||
                         tableName.includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    
    return matchesSearch && matchesAction && matchesTable;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueTables = [...new Set(logs.map(log => log.table_name))];

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
            Historique de toutes les actions sur les données
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par utilisateur ou table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes tables</SelectItem>
                {uniqueTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {getTableLabel(table)}
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
                  <p className="text-gray-600">
                    {logs.length === 0 ? "Aucun log disponible" : "Aucun log trouvé"}
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${getActionColor(log.action)} text-white`}>
                      {getTableIcon(log.table_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getActionColor(log.action)} text-white`}>
                            {log.action}
                          </Badge>
                          <span className="text-sm font-medium">
                            {getTableLabel(log.table_name)}
                          </span>
                        </div>
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

                      {log.record_id && (
                        <div className="text-xs text-gray-500 mb-2">
                          ID: {log.record_id}
                        </div>
                      )}

                      {(log.old_values || log.new_values) && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Voir les détails
                          </summary>
                          <div className="mt-2 space-y-2">
                            {log.old_values && (
                              <div className="text-xs">
                                <strong>Anciennes valeurs:</strong>
                                <pre className="mt-1 bg-red-50 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div className="text-xs">
                                <strong>Nouvelles valeurs:</strong>
                                <pre className="mt-1 bg-green-50 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
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
