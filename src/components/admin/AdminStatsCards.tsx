
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Clock, CheckCircle, Mail } from "lucide-react";

interface AdminStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    validated: number;
    sent: number;
  };
}

const AdminStatsCards = ({ stats }: AdminStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6 text-center">
          <Bot className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-gray-600">Total Courriers</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
          <div className="text-gray-600">En Attente</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.validated}</div>
          <div className="text-gray-600">Validés</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Mail className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.sent}</div>
          <div className="text-gray-600">Envoyés</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsCards;
