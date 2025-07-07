
import { Badge } from "@/components/ui/badge";
import { User, FileText, CreditCard, Calendar, Activity, Eye } from "lucide-react";
import { ActivityLog } from "@/types/activity-logs";

interface ActivityLogItemProps {
  log: ActivityLog;
}

const ActivityLogItem = ({ log }: ActivityLogItemProps) => {
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return "bg-green-500";
      case 'update':
      case 'modify':
        return "bg-blue-500";
      case 'delete':
      case 'remove':
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-full ${getActionColor(log.action)} text-white`}>
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className={`${getActionColor(log.action)} text-white`}>
              {log.action}
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            {log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : 'Date inconnue'}
          </span>
        </div>
        
        {log.profiles && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              {log.profiles.first_name} {log.profiles.last_name}
            </span>
            <span className="text-xs text-gray-500">
              ({log.profiles.email})
            </span>
          </div>
        )}

        {log.target_user_id && (
          <div className="text-xs text-gray-500 mb-2">
            Utilisateur cible: {log.target_user_id}
          </div>
        )}

        {log.details && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Voir les détails
            </summary>
            <div className="mt-2">
              <div className="text-xs">
                <strong>Détails:</strong>
                <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ActivityLogItem;
