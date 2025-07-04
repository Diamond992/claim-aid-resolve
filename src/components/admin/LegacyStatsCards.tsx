
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, XCircle, CheckCircle } from "lucide-react";

interface LegacyStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    validated: number;
    sent: number;
  };
}

const LegacyStatsCards = ({ stats }: LegacyStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-gray-600">Total Dossiers</div>
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
          <XCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.validated}</div>
          <div className="text-gray-600">En Cours</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.sent}</div>
          <div className="text-gray-600">Complétés</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegacyStatsCards;
