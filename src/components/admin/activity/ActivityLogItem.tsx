
import { Badge } from "@/components/ui/badge";
import { User, FileText, CreditCard, Calendar, Activity, Eye } from "lucide-react";
import { ActivityLog } from "@/types/activity-logs";

interface ActivityLogItemProps {
  log: ActivityLog;
}

const ActivityLogItem = ({ log }: ActivityLogItemProps) => {
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

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
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
  );
};

export default ActivityLogItem;
