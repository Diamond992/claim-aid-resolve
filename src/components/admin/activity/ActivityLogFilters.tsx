
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ActivityLog } from "@/types/activity-logs";

interface ActivityLogFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  actionFilter: string;
  setActionFilter: (filter: string) => void;
  logs: ActivityLog[];
}

const ActivityLogFilters = ({
  searchTerm,
  setSearchTerm,
  actionFilter,
  setActionFilter,
  logs
}: ActivityLogFiltersProps) => {
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher par utilisateur..."
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
    </div>
  );
};

export default ActivityLogFilters;
