
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, User, Shield, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          profiles!admin_audit_log_admin_user_id_fkey (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error("Erreur lors du chargement des logs d'audit");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ADMIN_INVITE_CREATED':
        return <User className="h-4 w-4" />;
      case 'USER_ROLE_CHANGED':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ADMIN_INVITE_CREATED':
        return "bg-blue-500";
      case 'USER_ROLE_CHANGED':
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'ADMIN_INVITE_CREATED':
        return "Invitation Admin";
      case 'USER_ROLE_CHANGED':
        return "Changement de Rôle";
      default:
        return action;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Chargement des logs d'audit...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Journal d'Audit</h2>
        <p className="text-gray-600">Historique des actions administratives</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Activité Récente
          </CardTitle>
          <CardDescription>
            Les 100 dernières actions administratives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${getActionColor(log.action)} text-white`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Badge className={`${getActionColor(log.action)} text-white`}>
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mt-1">
                      <strong>Admin:</strong> {log.profiles?.first_name} {log.profiles?.last_name} ({log.profiles?.email})
                    </p>
                    {log.details && (
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Détails:</strong>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-xs bg-white p-2 rounded border">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {auditLogs.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune activité
            </h3>
            <p className="text-gray-600">
              Aucune action administrative n'a été enregistrée.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditLog;
