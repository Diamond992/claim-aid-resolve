
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, CheckCircle, Clock, ExternalLink } from "lucide-react";

interface WebhookLog {
  id: string;
  webhook_url: string;
  payload: any;
  status: 'success' | 'error' | 'timeout';
  response_body: string | null;
  error_message: string | null;
  attempt_number: number;
  created_at: string;
}

export const WebhookLogsList = () => {
  const { data: webhookLogs, isLoading } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WebhookLog[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getEventLabel = (payload: any) => {
    if (!payload || !payload.event) return 'Événement inconnu';
    
    const eventLabels: { [key: string]: string } = {
      'document_uploaded': 'Document téléchargé',
      'courrier_created': 'Courrier créé',
      'courrier_validated': 'Courrier validé',
      'courrier_sent': 'Courrier envoyé',
      'echeance_created': 'Échéance créée',
      'echeance_alert': 'Alerte échéance',
      'echeance_status_changed': 'Statut échéance modifié'
    };

    return eventLabels[payload.event] || payload.event;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Logs des Webhooks Make.com
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Logs des Webhooks Make.com
          <Badge variant="outline">{webhookLogs?.length || 0} entrées</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {webhookLogs?.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-medium">
                      {getEventLabel(log.payload)}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">URL Webhook:</span>
                    <div className="text-muted-foreground break-all">
                      {log.webhook_url}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Tentative:</span>
                    <div className="text-muted-foreground">
                      #{log.attempt_number}
                    </div>
                  </div>
                </div>

                {log.error_message && (
                  <div className="bg-red-50 p-3 rounded-md">
                    <span className="font-medium text-red-800">Erreur:</span>
                    <div className="text-red-700 text-sm mt-1">
                      {log.error_message}
                    </div>
                  </div>
                )}

                {log.payload && (
                  <details className="bg-gray-50 p-3 rounded-md">
                    <summary className="font-medium cursor-pointer text-sm">
                      Payload envoyé
                    </summary>
                    <pre className="text-xs mt-2 overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>
                )}

                {log.response_body && log.status === 'success' && (
                  <details className="bg-green-50 p-3 rounded-md">
                    <summary className="font-medium cursor-pointer text-sm text-green-800">
                      Réponse reçue
                    </summary>
                    <pre className="text-xs mt-2 overflow-x-auto text-green-700">
                      {log.response_body}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            {!webhookLogs?.length && (
              <div className="text-center p-8 text-muted-foreground">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun log de webhook disponible</p>
                <p className="text-sm">
                  Les logs apparaîtront ici lors des prochains envois de webhooks
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
