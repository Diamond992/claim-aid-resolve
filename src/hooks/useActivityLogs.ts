
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ActivityLog } from "@/types/activity-logs";

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivityLogs = async () => {
    try {
      // Fetch audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      // Get unique target user IDs
      const targetUserIds = [...new Set(
        auditLogs
          ?.filter(log => log.target_user_id)
          .map(log => log.target_user_id)
      )].filter(Boolean);

      // Fetch profiles for target users
      let profilesMap: Record<string, any> = {};
      if (targetUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', targetUserIds);

        if (!profilesError && profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combine audit logs with profile data
      const logsWithProfiles: ActivityLog[] = auditLogs?.map(log => ({
        ...log,
        profiles: log.target_user_id ? profilesMap[log.target_user_id] || null : null
      })) || [];

      setLogs(logsWithProfiles);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error("Erreur lors du chargement des logs d'activité");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  return {
    logs,
    isLoading,
    refetch: fetchActivityLogs
  };
};
