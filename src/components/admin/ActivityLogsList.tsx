
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "lucide-react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import ActivityLogFilters from "./activity/ActivityLogFilters";
import ActivityLogItem from "./activity/ActivityLogItem";

const ActivityLogsList = () => {
  const { logs, isLoading } = useActivityLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");

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
          <ActivityLogFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            actionFilter={actionFilter}
            setActionFilter={setActionFilter}
            tableFilter={tableFilter}
            setTableFilter={setTableFilter}
            logs={logs}
          />

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
                  <ActivityLogItem key={log.id} log={log} />
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
