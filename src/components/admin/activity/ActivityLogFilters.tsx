
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ActivityLog } from "@/types/activity-logs";

interface ActivityLogFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  actionFilter: string;
  setActionFilter: (filter: string) => void;
  tableFilter: string;
  setTableFilter: (filter: string) => void;
  logs: ActivityLog[];
}

const ActivityLogFilters = ({
  searchTerm,
  setSearchTerm,
  actionFilter,
  setActionFilter,
  tableFilter,
  setTableFilter,
  logs
}: ActivityLogFiltersProps) => {
  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueTables = [...new Set(logs.map(log => log.table_name))];

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
  );
};

export default ActivityLogFilters;
